import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.43.4";
import { timingSafeEqual } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BANNED_WORDS = [
  // Profanity and slurs (simplified list)
  /\bf+u+c+k+/gi,
  /\bsh+i+t/gi,
  /\basshole/gi,
  // Spam patterns
  /\bVIAGRA\b/gi,
  /\bCAILAS\b/gi,
  // Personal info patterns
  /\d{3}-\d{2}-\d{4}/, // SSN
  /\b\w+@\w+\.\w+\b/, // Email
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{3}\b/, // Credit card
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone
];

interface PostMessageRequest {
  nickname: string;
  message: string;
}

interface GeoData {
  country: string;
  countryName: string;
}

// Get client IP from request
function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("cf-connecting-ip") || "127.0.0.1";
}

// Hash IP using crypto
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Check for banned content
function checkBannedContent(text: string): boolean {
  for (const pattern of BANNED_WORDS) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // Check for too many special characters (>30%)
  const specialCharCount = (text.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || [])
    .length;
  if (specialCharCount / text.length > 0.3) {
    return true;
  }

  return false;
}

// Lookup geolocation from IP
async function lookupGeo(ip: string): Promise<GeoData> {
  if (ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return { country: "XX", countryName: "Unknown" };
  }

  try {
    const response = await fetch("http://ip-api.com/json/" + ip + "?fields=countryCode,country", {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return { country: "XX", countryName: "Unknown" };
    }

    const data = (await response.json()) as { countryCode?: string; country?: string };
    return {
      country: data.countryCode || "XX",
      countryName: data.country || "Unknown",
    };
  } catch {
    return { country: "XX", countryName: "Unknown" };
  }
}

// Check rate limit
async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  ipHash: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact" })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  return (count || 0) < limit;
}

// Handle POST - Create message
async function handlePost(req: Request): Promise<Response> {
  try {
    const json = (await req.json()) as PostMessageRequest;
    const { nickname, message } = json;

    // Validate inputs
    if (!nickname || !message) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing nickname or message" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (nickname.length < 2 || nickname.length > 20) {
      return new Response(
        JSON.stringify({ success: false, error: "Nickname must be 2-20 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (message.length > 400) {
      return new Response(
        JSON.stringify({ success: false, error: "Message must be 400 characters or less" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for banned content
    if (checkBannedContent(message) || checkBannedContent(nickname)) {
      return new Response(
        JSON.stringify({ success: false, error: "Message contains prohibited content" }),
        {
          status: 451,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get IP and hash it
    const ip = getClientIP(req);
    const ipHash = await hashIP(ip);

    // Lookup geolocation
    const geo = await lookupGeo(ip);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );

    // Check rate limit: 5 messages per hour
    const hasQuota = await checkRateLimit(supabase, ipHash, 5, 3600000);
    if (!hasQuota) {
      return new Response(
        JSON.stringify({ success: false, error: "Rate limit exceeded. Max 5 messages per hour" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert message
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          nickname: nickname.trim(),
          message: message.trim(),
          country: geo.country,
          country_name: geo.countryName,
          ip_hash: ipHash,
          expires_at: expiresAt,
        },
      ])
      .select();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create message" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const messageData = data?.[0];
    const timeRemaining = new Date(messageData.expires_at).getTime() - Date.now();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          _id: messageData.id,
          nickname: messageData.nickname,
          message: messageData.message,
          country: messageData.country,
          countryName: messageData.country_name,
          createdAt: messageData.created_at,
          expiresAt: messageData.expires_at,
          timeRemaining,
          isHighlighted: messageData.is_highlighted,
          reportCount: messageData.report_count,
        },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// Handle GET - List messages
async function handleGet(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 1000);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("is_hidden", false)
      .eq("is_private", false)
      .gt("expires_at", new Date().toISOString())
      .order("is_highlighted", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch messages" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formattedData = (data || []).map((msg) => ({
      _id: msg.id,
      nickname: msg.nickname,
      message: msg.message,
      country: msg.country,
      countryName: msg.country_name,
      createdAt: msg.created_at,
      expiresAt: msg.expires_at,
      timeRemaining: new Date(msg.expires_at).getTime() - Date.now(),
      isHighlighted: msg.is_highlighted,
      reportCount: msg.report_count,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedData,
        meta: { total: formattedData.length, returned: formattedData.length },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method === "GET") {
    return handleGet(req);
  }

  if (req.method === "POST") {
    return handlePost(req);
  }

  return new Response(
    JSON.stringify({ success: false, error: "Method not allowed" }),
    {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});

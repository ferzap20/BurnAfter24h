import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateReportRequest {
  messageId: string;
  reason?: string;
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

// Check rate limit
async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  ipHash: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count } = await supabase
    .from("reports")
    .select("id", { count: "exact" })
    .eq("reporter_ip_hash", ipHash)
    .gte("created_at", since);

  return (count || 0) < limit;
}

// Handle POST - Create report
async function handlePost(req: Request): Promise<Response> {
  try {
    const json = (await req.json()) as CreateReportRequest;
    const { messageId, reason } = json;

    // Validate inputs
    if (!messageId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing messageId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (reason && reason.length > 200) {
      return new Response(
        JSON.stringify({ success: false, error: "Reason must be 200 characters or less" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get IP and hash it
    const ip = getClientIP(req);
    const ipHash = await hashIP(ip);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );

    // Check rate limit: 10 reports per hour
    const hasQuota = await checkRateLimit(supabase, ipHash, 10, 3600000);
    if (!hasQuota) {
      return new Response(
        JSON.stringify({ success: false, error: "Rate limit exceeded. Max 10 reports per hour" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if message exists
    const { data: messageExists, error: messageCheckError } = await supabase
      .from("messages")
      .select("id")
      .eq("id", messageId)
      .maybeSingle();

    if (messageCheckError || !messageExists) {
      return new Response(
        JSON.stringify({ success: false, error: "Message not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Try to create report (will fail if duplicate due to unique constraint)
    const { error: reportError } = await supabase.from("reports").insert([
      {
        message_id: messageId,
        reporter_ip_hash: ipHash,
        reason: reason ? reason.trim() : null,
        status: "pending",
      },
    ]);

    if (reportError) {
      // Unique constraint violation means duplicate report
      if (reportError.code === "23505") {
        return new Response(
          JSON.stringify({ success: false, error: "You have already reported this message" }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.error("Database error:", reportError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create report" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Increment report count
    const { data: messageData, error: getError } = await supabase
      .from("messages")
      .select("report_count")
      .eq("id", messageId)
      .maybeSingle();

    if (!getError && messageData) {
      const newReportCount = (messageData.report_count || 0) + 1;

      // Auto-hide if report count >= 5
      const shouldHide = newReportCount >= 5;

      await supabase
        .from("messages")
        .update({
          report_count: newReportCount,
          is_hidden: shouldHide,
        })
        .eq("id", messageId);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Report submitted successfully" }),
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

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
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

interface CountryFlagProps {
  country: string;
  countryName: string;
  size?: number;
}

export function CountryFlag({ country, countryName, size = 20 }: CountryFlagProps) {
  const code = country.toLowerCase();

  if (code === 'xx') {
    return (
      <span
        className="inline-flex items-center justify-center bg-smoke-500 rounded text-smoke-200 text-xs font-mono"
        style={{ width: size * 1.4, height: size }}
        title="Unknown location"
      >
        ?
      </span>
    );
  }

  return (
    <img
      className="flag-img inline-block"
      src={`https://flagcdn.com/w${size * 2}/${code}.png`}
      srcSet={`https://flagcdn.com/w${size * 4}/${code}.png 2x`}
      width={size * 1.4}
      height={size}
      alt={countryName}
      title={countryName}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

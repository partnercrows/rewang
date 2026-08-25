interface PhoneMockupProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  objectPosition?: string;
  /** Tailwind aspect class (e.g. "aspect-[9/17]") to crop screenshots to a uniform height. */
  aspectClass?: string;
}

export function PhoneMockup({
  src,
  alt,
  className = "",
  imgClassName = "",
  objectPosition,
  aspectClass,
}: PhoneMockupProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative rounded-[2.25rem] bg-gradient-to-b from-[#3a3a3a] to-[#141414] pt-5 px-2 pb-2 shadow-xl shadow-black/20 ring-1 ring-black/10">
        <div className="absolute left-1/2 top-2.5 h-2 w-2 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />
        <div className="overflow-hidden rounded-[1.6rem] bg-white">
          <img
            src={src}
            alt={alt}
            draggable={false}
            className={
              aspectClass
                ? `block w-full ${aspectClass} object-cover object-top ${imgClassName}`
                : `block w-full h-auto ${imgClassName}`
            }
            style={objectPosition ? { objectPosition } : undefined}
          />
        </div>
      </div>
    </div>
  );
}

import React from "react";

type StarBorderProps = React.HTMLAttributes<HTMLDivElement> & {
  color?: string;
  speed?: React.CSSProperties["animationDuration"];
  thickness?: number;
  innerClassName?: string;
};

const StarBorder: React.FC<StarBorderProps> = ({
  className = "",
  color = "white",
  speed = "6s",
  thickness = 1,
  innerClassName = "",
  children,
  style,
  ...rest
}) => {
  return (
    <div
      className={`relative inline-block overflow-hidden rounded-lg ${className}`}
      style={{
        padding: `${thickness}px 0`,
        ...style,
      }}
      {...rest}
    >
      <div
        className="animate-star-movement-bottom absolute bottom-[-11px] right-[-250%] z-0 h-1/2 w-[300%] rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="animate-star-movement-top absolute left-[-250%] top-[-10px] z-0 h-1/2 w-[300%] rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={`relative z-10 rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(24,18,34,0.96),rgba(14,10,22,0.96))] text-center text-white ${innerClassName}`}
      >
        {children}
      </div>
    </div>
  );
};

export default StarBorder;

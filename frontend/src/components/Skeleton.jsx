import "./Skeleton.css";

export default function Skeleton({ width, height, borderRadius = "4px", className = "" }) {
    const style = {
        width: width || "100%",
        height: height || "1em",
        borderRadius: borderRadius
    };

    return <div className={`skeleton-box ${className}`} style={style}></div>;
}

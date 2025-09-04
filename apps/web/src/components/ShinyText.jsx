import "./ShinyText.css";

const ShinyText = ({
  type,
  text,
  disabled = false,
  speed = 5,
  className = "",
}) => {
  const animationDuration = `${speed}s`;

  const _tag = type || "div";

  return (
    <_tag
      className={`shiny-text ${disabled ? "disabled" : ""} ${className}`}
      style={{ animationDuration }}
    >
      {text}
    </_tag>
  );
};

export default ShinyText;

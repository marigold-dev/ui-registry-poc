type props = {
  className?: string;
};

const Spinner = ({ className = "w-12 h-12" }: props) => {
  return (
    <div className={className}>
      <svg className={`Spinner h-full w-full`} viewBox="0 0 50 50">
        <circle
          className="Spinner__path"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="2"
        ></circle>
      </svg>
    </div>
  );
};

export default Spinner;

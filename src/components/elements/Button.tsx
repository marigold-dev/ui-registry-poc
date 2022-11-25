import Spinner from "../Spinner";

export enum ButtonAppearance {
  Primary,
  Secondary,
  Icon,
}

export type props = {
  children: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  appearance?: ButtonAppearance;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
};

const Button = ({
  children,
  onClick,
  appearance = ButtonAppearance.Primary,
  disabled = false,
  className = "",
  loading = false,
}: props) => {
  const colors = (() => {
    switch (appearance) {
      case ButtonAppearance.Primary:
        return "bg-indigo-500 hover:bg-indigo-600 px-4 py-2";
      case ButtonAppearance.Secondary:
        return "bg-background-300 hover:bg-background-200 px-4 py-2";

      case ButtonAppearance.Icon:
        return "bg-background-400 hover:bg-background-300 px-2 py-2";
    }
  })();

  return (
    <button
      className={`transition-colors rounded ${colors} ${
        disabled || loading ? "pointer-events-none opacity-50" : ""
      } ${className}`}
      onClick={onClick}
    >
      {loading ? <Spinner className="w-8 h-8 m-auto" /> : children}
    </button>
  );
};

export default Button;

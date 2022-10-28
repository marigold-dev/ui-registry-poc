import { Width, Height, ViewBox } from "../../types/size";

export type Props = {
  width: Width;
  height: Height;
  viewBox: ViewBox;
  fill?: string;
  children?: React.ReactNode;
};

export const normalizeNumber = (x: number): string => "" + x;
export const normalizeViewbox = ({
  minX,
  minY,
  width,
  height,
}: ViewBox): string =>
  normalizeNumber(minX) +
  " " +
  normalizeNumber(minY) +
  " " +
  normalizeNumber(width) +
  " " +
  normalizeNumber(height);

export const normalizeFill = (x: string | undefined): string =>
  x === undefined ? "none" : x;

const CustomSvg = ({ width, height, viewBox, fill, children }: Props) => {
  return (
    <svg
      width={normalizeNumber(width)}
      height={normalizeNumber(height)}
      viewBox={normalizeViewbox(viewBox)}
      fill={normalizeFill(fill)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
};

export default CustomSvg;

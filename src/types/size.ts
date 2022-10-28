export type Width = number;
export type Height = number;

export type PosX = number;
export type PosY = number;

export interface ViewBox {
  readonly minX: PosX;
  readonly minY: PosY;
  readonly width: Width;
  readonly height: Height;
}

export const viewbox = (
  minX: PosX,
  minY: PosY,
  width: Width,
  height: Height
) => ({
  minX,
  minY,
  width,
  height,
});

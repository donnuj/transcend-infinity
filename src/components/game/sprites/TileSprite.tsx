"use client";

import { CSSProperties } from "react";

interface TileSpriteMeta {
  tileWidth: number;
  tileHeight: number;
  margin?: number;
  columns: number;
  scale?: number;
}

interface Props {
  src: string;
  meta: TileSpriteMeta;
  col: number;
  row: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function TileSprite({ src, meta, col, row, className, style, title }: Props) {
  const scale = meta.scale ?? 1;
  const margin = meta.margin ?? 0;
  const tw = meta.tileWidth;
  const th = meta.tileHeight;
  const step = tw + margin;

  const sheetCols = meta.columns;
  const sheetW = (step * sheetCols - margin) * scale;

  const x = -(col * step) * scale;
  const y = -(row * step) * scale;

  return (
    <div
      className={className}
      title={title}
      style={{
        width: tw * scale,
        height: th * scale,
        backgroundImage: `url(${src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${sheetW}px auto`,
        backgroundPosition: `${x}px ${y}px`,
        imageRendering: "pixelated",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

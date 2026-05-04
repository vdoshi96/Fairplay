import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 512,
  height: 512
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#FFFDF8",
          border: "24px solid #20212A",
          borderRadius: 112,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            border: "16px solid #D9714A",
            borderRadius: 180,
            display: "flex",
            height: 280,
            justifyContent: "center",
            position: "relative",
            width: 280
          }}
        >
          <div
            style={{
              background: "#2C8F7A",
              borderRadius: 999,
              height: 72,
              left: -24,
              position: "absolute",
              top: 96,
              width: 72
            }}
          />
          <div
            style={{
              background: "#4568D9",
              borderRadius: 999,
              height: 72,
              position: "absolute",
              right: -24,
              top: 96,
              width: 72
            }}
          />
          <div
            style={{
              background: "#F2B84B",
              borderRadius: 24,
              height: 48,
              position: "absolute",
              right: 42,
              top: 24,
              transform: "rotate(45deg)",
              width: 48
            }}
          />
          <div
            style={{
              borderBottom: "70px solid #20212A",
              borderLeft: "70px solid transparent",
              borderRight: "70px solid transparent",
              height: 0,
              marginTop: -24,
              width: 0
            }}
          />
          <div
            style={{
              background: "#20212A",
              borderRadius: 12,
              height: 84,
              marginLeft: -118,
              marginTop: 82,
              position: "absolute",
              width: 136
            }}
          />
        </div>
      </div>
    ),
    size
  );
}

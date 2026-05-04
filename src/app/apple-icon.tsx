import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 180,
  height: 180
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#FFFDF8",
          border: "10px solid #20212A",
          borderRadius: 40,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            border: "6px solid #D9714A",
            borderRadius: 58,
            display: "flex",
            height: 104,
            justifyContent: "center",
            position: "relative",
            width: 104
          }}
        >
          <div
            style={{
              background: "#2C8F7A",
              borderRadius: 999,
              height: 26,
              left: -10,
              position: "absolute",
              top: 38,
              width: 26
            }}
          />
          <div
            style={{
              background: "#4568D9",
              borderRadius: 999,
              height: 26,
              position: "absolute",
              right: -10,
              top: 38,
              width: 26
            }}
          />
          <div
            style={{
              background: "#F2B84B",
              borderRadius: 8,
              height: 18,
              position: "absolute",
              right: 14,
              top: 8,
              transform: "rotate(45deg)",
              width: 18
            }}
          />
          <div
            style={{
              borderBottom: "27px solid #20212A",
              borderLeft: "27px solid transparent",
              borderRight: "27px solid transparent",
              height: 0,
              marginTop: -10,
              width: 0
            }}
          />
          <div
            style={{
              background: "#20212A",
              borderRadius: 5,
              height: 32,
              marginLeft: -46,
              marginTop: 32,
              position: "absolute",
              width: 54
            }}
          />
        </div>
      </div>
    ),
    size
  );
}

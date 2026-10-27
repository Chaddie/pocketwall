import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#071018",
        }}
      >
        <div
          style={{
            width: 340,
            height: 340,
            borderRadius: 88,
            background: "#102833",
            border: "16px solid #3ee0c5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#3ee0c5",
            fontSize: 180,
            fontWeight: 800,
          }}
        >
          P
        </div>
      </div>
    ),
    size
  );
}

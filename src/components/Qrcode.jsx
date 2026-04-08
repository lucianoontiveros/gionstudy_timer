import React, { useState, useEffect, memo } from "react";
import QRCode from "qrcode";
import "./qrcode.css";

const Qrcode = memo(({ token }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (token) {
      const link = `https://forestapp.cc/join-room/?token=${token}`;
      QRCode.toDataURL(
        link,
        {
          errorCorrectionLevel: "H",
          color: {
            dark: "#FD99BE", // Rosa
            light: "#000000", // Fondo negro
          },
        },
        (err, url) => {
          if (err) return console.error(err);
          setQrCodeUrl(url);
          setIsVisible(true);
          setTimeout(() => {
            setIsVisible(false);
          }, 480000);
        }
      );
    }
  }, [token]);

  return (
    <div
      className="qrcode"
      style={{ display: isVisible ? "block" : "none", textAlign: "center" }}
    >
      {qrCodeUrl && (
        <img
          src={qrCodeUrl}
          alt="QR Code"
          style={{ display: "block", margin: "0 auto" }}
        />
      )}
      <div className="qr-token">
        <p className="codigo">🌳CÓDIGO: {token.toUpperCase()}</p>
      </div>
    </div>
  );
});

export default Qrcode;

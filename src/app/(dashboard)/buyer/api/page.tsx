"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function BuyerApiPage() {
  // faqat backend API’lar
  return <SwaggerUI url="/openapi.json?scope=backend" />;
}

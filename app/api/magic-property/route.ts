import { NextResponse, type NextRequest } from "next/server";
import { GoogleGenerativeAI, InlineDataPart } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, pdfBase64, imageBase64, fileName } = body;

    if (!address && !pdfBase64 && !imageBase64) {
      return NextResponse.json({ error: "Se requiere dirección, archivo PDF o imagen" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let result;
    if (pdfBase64 || imageBase64) {
      const base64Data = (pdfBase64 || imageBase64).replace(/^data:.*?;base64,/, "");
      let mimeType = "application/octet-stream";
      
      if (pdfBase64) {
        mimeType = "application/pdf";
      } else if (imageBase64) {
        if (fileName?.match(/\.(png|PNG)$/)) {
          mimeType = "image/png";
        } else if (fileName?.match(/\.(jpg|jpeg|JPG|JPEG)$/)) {
          mimeType = "image/jpeg";
        } else if (fileName?.match(/\.(webp|WEBP)$/)) {
          mimeType = "image/webp";
        } else if (imageBase64.startsWith("iVBOR") || fileName?.match(/\.png$/i)) {
          mimeType = "image/png";
        } else if (imageBase64.startsWith("/9j/") || fileName?.match(/\.jpe?g$/i)) {
          mimeType = "image/jpeg";
        } else if (imageBase64.startsWith("UklGR") || fileName?.match(/\.webp$/i)) {
          mimeType = "image/webp";
        }
      }

      const isPdf = mimeType === "application/pdf";

      const imagePart: InlineDataPart = {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      };

      result = await model.generateContent([
        imagePart,
        {
          text: `Extrae la siguiente información de ${isPdf ? "este documento PDF" : "esta imagen"} de propiedad inmobiliaria en Bolivia:
- Título/Anuncio
- Descripción
- Precio y moneda
- Tipo de propiedad (casa, departamento, terreno, oficina, local comercial)
- Área en metros cuadrados
- Número de habitaciones
- Número de baños
- Dirección exacta
- Barrio/Urbanización
- Ciudad
- Coordenadas GPS si están disponibles

Responde SOLO en JSON con este formato exacto, sin texto adicional:
{
  "title": "",
  "description": "",
  "price": 0,
  "currency": "USD",
  "property_type": "",
  "area_m2": 0,
  "bedrooms": 0,
  "bathrooms": 0,
  "address": "",
  "neighborhood": "",
  "city": "",
  "lat": null,
  "lng": null
}`,
        },
      ]);
    } else {
      result = await model.generateContent([
        {
          text: `Busca información sobre la siguiente dirección de propiedad inmobiliaria en Bolivia: "${address}"

Proporciona un resumen del vecindario/área y geocodifica la dirección si es posible.

Responde SOLO en JSON con este formato exacto, sin texto adicional:
{
  "address": "",
  "neighborhood": "",
  "city": "",
  "lat": null,
  "lng": null,
  "neighborhood_summary": ""
}`,
        },
      ]);
    }

    const response = result.response;
    const text = response.text();

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch {
      // If JSON parsing fails, return raw text
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("magic-property error:", err);
    const message = err instanceof Error ? err.message : "Error al generar con IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

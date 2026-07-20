import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fija la raíz del workspace a esta carpeta. Sin esto, Turbopack detecta
  // otro package-lock.json en el home del usuario y podría inferir mal la
  // raíz del proyecto.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

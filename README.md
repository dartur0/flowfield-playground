# flow field

An interactive, ambient generative art application built with **p5.js** and **Vanilla JavaScript**. It explores noise-driven particle flow fields and organic fluid shapes with real-time UI customization and mouse interactivity.

![Live Demo]((https://dartur0.github.io/flowfield-playground/))

---

## Features

- **2 Visual Modes:**
  - **Flow Field:** Silk-like particle trails guided by 3D Perlin noise vector fields.
  - **Fluid Blobs:** Ambient, lava-lamp-style organic glowing orbs with soft multilayered Bezier deformations.
- **Curated Color Palettes (HSB Color Space):**
  - **Aurora:** Vibrant oceanic blue-purple gradients.
  - **Sunset:** Warm golden-orange glow.
  - **Graphite:** Minimalist, sleek monochrome tones.
- **Interactive Mechanics:**
  - **Hover:** Particles and fluid orbs gently react and disperse around the mouse cursor.
  - **Hold Click:** Triggers a gravitational vortex/spiral effect that draws particles and blobs inward.
- **Custom UI Controls:** Glassmorphic panel for adjusting speed, noise scale, particle density, and color themes in real time.

---

## Tech Stack

- **Core:** JavaScript (ES6+), HTML5 Canvas API
- **Graphics Library:** [p5.js](https://p5.js.org/)
- **Mathematics:** Perlin Noise, Vector Physics, Custom Curve Deformations
- **UI & Typography:** Modern CSS3, CSS Variables, Glassmorphism, Google Fonts (*Manrope*)

---

## Quick Start

1. Clone the repository:
   ```bash
   git clone [https://github.com/dartur0/interactive-flow-field.git](https://github.com/dartur0/interactive-flow-field.git)

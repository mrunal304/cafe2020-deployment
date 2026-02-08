import { useEffect, useState } from "react";
import "./BackgroundCarousel.css";

// Import main cafe interior image
import cafeMain from "../assets/CAFE.jpeg";

// Import food images
import image1 from "../assets/image1.jpeg";
import image2 from "../assets/image2.jpeg";
import image3 from "../assets/image3.jpeg";
import image5 from "../assets/image5.jpeg";
import image6 from "../assets/image6.jpeg";

// Images with custom duration for each
const imageConfig = [
  { src: cafeMain, duration: 6000 },  // Cafe interior - 6 seconds
  { src: image6, duration: 3000 },    // Coffee beans - 3 seconds
  { src: image2, duration: 3000 },    // Burger - 3 seconds
  { src: image1, duration: 3000 },    // Pasta - 3 seconds
  { src: image3, duration: 3000 },    // Dessert - 3 seconds
  { src: image5, duration: 3000 }     // Matcha - 3 seconds
];

export default function BackgroundCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Get duration for current image
    const currentDuration = imageConfig[current].duration;
    
    // Set timeout for current image
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % imageConfig.length);
    }, currentDuration);

    // Cleanup
    return () => clearTimeout(timer);
  }, [current]);

  return (
    <div className="bg-carousel">
      {imageConfig.map((config, index) => (
        <div
          key={index}
          className={`bg-slide ${index === current ? "active" : ""}`}
          style={{ backgroundImage: `url(${config.src})` }}
        />
      ))}
    </div>
  );
}

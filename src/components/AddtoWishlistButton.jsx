// src/components/AddToWishlistButton.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import useSound from "use-sound";
import clickSfx from "@/assets/click.mp3";
import confettiSfx from "@/assets/success.mp3";
import { shootConfetti } from "@/lib/utils";

const AddToWishlistButton = ({ item, onAdd, className = "" }) => {
  const [playClick] = useSound(clickSfx, { volume: 0.3 });
  const [playConfetti] = useSound(confettiSfx, { volume: 0.7 });

  const handleClick = () => {
    playClick();
    onAdd(item); // Calls parent's add logic (and toast!)
    setTimeout(() => {
      shootConfetti();
      playConfetti();
    }, 180);
  };

  return (
    <Button onClick={handleClick} className={`${className} animate-bounce`}>
      Add to Wishlist
    </Button>
  );
};

export default AddToWishlistButton;

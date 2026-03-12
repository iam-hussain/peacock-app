"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { isSoundEnabled, playConfirmSound, toggleSound } from "@/lib/ui/sounds";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isSoundEnabled());
  }, []);

  const handleToggle = () => {
    const newState = toggleSound();
    setEnabled(newState);
    if (newState) playConfirmSound();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      title={enabled ? "Mute sounds" : "Enable sounds"}
      className="text-muted-foreground hover:text-foreground"
    >
      {enabled ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
    </Button>
  );
}

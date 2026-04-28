import { extend } from "@pixi/react";
import { Container, Graphics, Sprite, Text } from "pixi.js";

/**
 * Tell @pixi/react which Pixi classes to expose as JSX intrinsics.
 * Imported once at app entry — the registration is global.
 */
extend({ Container, Graphics, Sprite, Text });

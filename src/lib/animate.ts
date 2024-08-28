export const animateHover = {
  initial: { scale: 1 },
  hover: { scale: 1.1 },
  pressed: { scale: 0.9 },
};

export const animateDecorator = {
  hide: {
    opacity: 0,
    zIndex: -10,
    transition: { duration: 0.3, ease: "linear" },
  },
  show: {
    opacity: 0.5,
    zIndex: 40,
    transition: { duration: 0.5, ease: "linear" },
  },
};

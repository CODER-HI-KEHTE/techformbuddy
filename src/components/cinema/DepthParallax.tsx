'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

export default function DepthParallax() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const farLayer = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const middleLayer = useTransform(scrollYProgress, [0, 1], [0, -330]);
  const nearLayer = useTransform(scrollYProgress, [0, 1], [0, -520]);
  return (
    <div className="cinema-depth-parallax" aria-hidden="true">
      <motion.div className="cinema-depth-layer cinema-depth-far" style={reduceMotion ? undefined : { y: farLayer }} />
      <motion.div className="cinema-depth-layer cinema-depth-middle" style={reduceMotion ? undefined : { y: middleLayer }} />
      <motion.div className="cinema-depth-layer cinema-depth-near" style={reduceMotion ? undefined : { y: nearLayer }} />
    </div>
  );
}

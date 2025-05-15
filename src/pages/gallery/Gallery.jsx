import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LeftOutlined, RightOutlined, CloseOutlined } from "@ant-design/icons";
import "./Gallery.css";

const images = [
  "https://ik.imagekit.io/fh2hj1ayv/DSC06426_11zon.jpg?updatedAt=1747319943370",
  "https://ik.imagekit.io/fh2hj1ayv/DSC07030_9_11zon.jpg?updatedAt=1747319942855",
  "https://ik.imagekit.io/fh2hj1ayv/DSC05071_11zon.jpg?updatedAt=1747319938982",
  "https://ik.imagekit.io/fh2hj1ayv/DSC05077_11zon.jpg?updatedAt=1747319942677",
  "https://ik.imagekit.io/fh2hj1ayv/DSC06430_11zon.jpg?updatedAt=1747319942351",
  "https://ik.imagekit.io/fh2hj1ayv/DSC07140_11zon.jpg?updatedAt=1747319932778",
  "https://ik.imagekit.io/fh2hj1ayv/DSC07455_16_11zon.jpg?updatedAt=1747320765790",
  "https://ik.imagekit.io/fh2hj1ayv/DSC06909_13_11zon.jpg?updatedAt=1747320764102",
  "https://ik.imagekit.io/fh2hj1ayv/DSC07050_14_11zon.jpg?updatedAt=1747320762530",
  "https://ik.imagekit.io/fh2hj1ayv/DSC07869_18_11zon.jpg?updatedAt=1747320746724",
  "https://ik.imagekit.io/fh2hj1ayv/DSC08213_11zon.jpg?updatedAt=1747320385104",
  "https://ik.imagekit.io/fh2hj1ayv/DSC07541_11zon.jpg?updatedAt=1747320383559",
];

const Header = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const handleOpen = (index) => setActiveIndex(index);
  const handleClose = () => setActiveIndex(null);
  const handlePrev = () =>
    setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const handleNext = () =>
    setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.4,
      },
    },
  };

  const nameItem = {
    hidden: { opacity: 0, y: 40, rotate: -5 },
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
        mass: 0.5,
      },
    },
  };

  const dateItem = {
    hidden: { opacity: 0, y: 30, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.6,
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const galleryItem = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", damping: 14, stiffness: 120 },
    },
  };

  const date = "Moments that tell our love story";

  return (
    <div className="oii">
      <motion.div
        className="header_container galpi"
        initial="hidden"
        animate="visible"
        variants={container}
      >
        <div className="header_content">
          <motion.h1 className="couple_name" variants={nameItem}>
            Our Journey Together
          </motion.h1>
          <motion.p
            className="actual_place"
            style={{ fontSize: "15px", marginTop: "-20px" }}
            variants={dateItem}
          >
            {date}
          </motion.p>
        </div>
      </motion.div>

      <motion.section
        className="gallery-section"
        initial="hidden"
        animate="visible"
        variants={container}
      >
        <motion.h2
          className="story_title"
          variants={nameItem}
          style={{ marginBottom: "30px" }}
        >
          Captured Memories: Our Love Journey
        </motion.h2>

        <div className="masonry-gallery">
          {images.map((src, index) => (
            <motion.div
              className="gallery-item"
              key={index}
              onClick={() => handleOpen(index)}
              variants={galleryItem}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <img src={src} alt={`Gallery ${index}`} loading="lazy" />
              <div className="image-overlay" />
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {activeIndex !== null && (
            <motion.div
              className="modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="modal-inner">
                <img
                  src={images[activeIndex]}
                  alt="Zoom"
                  className="modal-image"
                />
                <button className="modal-close" onClick={handleClose}>
                  <CloseOutlined />
                </button>
                <button className="modal-nav prev" onClick={handlePrev}>
                  <LeftOutlined />
                </button>
                <button className="modal-nav next" onClick={handleNext}>
                  <RightOutlined />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
};

export default Header;

import { useState } from "react";
import { motion } from "framer-motion";
import { Modal } from "antd";
import "antd/dist/reset.css";
import "./a.css";

const Acc = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
    hidden: {
      opacity: 0,
      y: 40,
      rotate: -5,
    },
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
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.8,
    },
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

  const date = "Stay at The Londoner or at an accommodation nearby.";

  const imageUrls = [
    "https://image-tc.galaxy.tf/wijpeg-6slp2f83uqabh1vbgps7qfzpt/01-ab-the-londoner-iii-pool-999_standard.jpg?crop=56%2C0%2C888%2C666",
    "https://image-tc.galaxy.tf/wijpeg-c7o8rdz1890leg1y0jeeefzzu/the-londoner-hotel-the-ballroom-pre-function-area_standard.jpg?crop=112%2C0%2C1777%2C1333",
    "https://image-tc.galaxy.tf/wijpeg-bcmcfh934oj3fmiace0v566il/the-londoner-tower-penthouse-top-floor-1_standard.jpg?crop=56%2C0%2C888%2C666",
    "https://image-tc.galaxy.tf/wijpeg-1k7b1othwpe6t3lhq53y9zli4/the-londoner-the-gallery_standard.jpg?crop=90%2C0%2C1421%2C1066",
    "https://image-tc.galaxy.tf/wijpeg-3fr3vwppragajcltp6acmuek8/the-londoner-hotel-whitcomb-s-interior_standard.jpg?crop=112%2C0%2C1777%2C1333",
  ];

  const showModal = (imgUrl) => {
    setSelectedImage(imgUrl);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="kkk">
      <motion.div
        className="header_container maliz"
        initial="hidden"
        animate="visible"
        variants={container}
      >
        <div className="header_content">
          <motion.h1 className="couple_name" variants={nameItem}>
            WHERE TO STAY
          </motion.h1>

          <motion.p
            className="actual_place"
            style={{ fontSize: "15px", marginTop: "20px",lineHeight:"150%" }}
            variants={dateItem}
          >
            {date}
          </motion.p>
        </div>
      </motion.div>

      <div className="dolx">
        <h2 className="story_title">Stay in Style at The Londoner</h2>

        <p className="story_para op">
          For a celebration as unforgettable as our wedding, we couldn’t have
          imagined a more iconic place than The Londoner—London’s first super
          boutique hotel.
          <br />
          <br />
          Thoughtfully designed with charm, elegance, and individuality, The
          Londoner is more than just a place to stay; it’s an experience. With
          its rich blend of modern luxury and timeless sophistication, this
          16-storey sanctuary in Leicester Square offers everything from rooftop
          lounges and tranquil wellness spaces to exquisite dining and
          world-class hospitality.
          <br />
          <br />
          As the heartbeat of our reception and your home for the night, The
          Londoner captures the spirit of London in the most enchanting way.
          We’re so thrilled to share this beautiful space—and our special
          day—with you.
        </p>
      </div>

      {/* Image Gallery Section */}
      <div className="gallery-wrapper">
        <h2
          className="story_title"
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          Hotel Gallery
        </h2>

        <div className="image-grid">
          {imageUrls.map((url, index) => (
            <motion.div
              key={index}
              className="image-container"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => showModal(url)}
            >
              <img src={url} alt={`hotel-${index}`} className="gallery-image" />
            </motion.div>
          ))}
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width="80%"
        style={{ top: 20 }}
        bodyStyle={{ padding: 0 }}
        centered
      >
        {selectedImage && (
          <img
            src={selectedImage}
            alt="full-size"
            style={{ width: "100%", height: "auto", maxHeight: "80vh" }}
          />
        )}
      </Modal>
    </div>
  );
};

export default Acc;

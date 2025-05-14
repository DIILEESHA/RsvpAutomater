import { motion } from "framer-motion";
import "./s.css";

const Story = () => {
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        when: "beforeChildren"
      }
    }
  };

  const fadeUp = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 0.77, 0.47, 0.97]
      }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut"
      }
    }
  };

  const imageSlide = {
    hidden: { x: 50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 1,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      className="s"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={container}
    >
      <div className="story_grid">
        {/* Text Content */}
        <motion.div className="story_sm" variants={fadeUp}>
          <motion.h2 className="story_title" variants={fadeUp}>
            Our Story
          </motion.h2>
          <motion.p className="story_para" variants={fadeIn}>
            Humayra and Henri met one fateful wintry NYC night in 2017 inside
            the Jane Hotel. After exchanging a few secret glances across the
            room, Henri mustered up the courage to approach the most beautiful
            woman he'd ever seen. What did he do next? Well, proceed to mislead
            her when asked about his occupation... but we'll save that story for
            the toasts!
            <br />
            <br />
            Once Humayra got over the initial deceit, they bonded over their
            love of travel, football (soccer), adventure and food. Over the past
            five years, they've been to 20+ countries together, raised
            (objectively) the cutest dog in the world and moved into a beautiful
            apartment in Brooklyn. In November 2021, after a day of snorkeling
            with hundreds of sharks, Henri popped the question in Bora Bora,
            French Polynesia.
          </motion.p>
        </motion.div>

        {/* Image Content */}
        <motion.div className="story_sm" variants={imageSlide}>
          <motion.img
            src="https://i.imgur.com/uUTIOF5.jpeg"
            alt="Couple"
            className="story_img"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4 }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Story;
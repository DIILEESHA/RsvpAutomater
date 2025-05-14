import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import "./d.css";

const Details = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  // Calm animation variants
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const fadeUp = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 0.77, 0.47, 0.97],
      },
    },
  };

  const gentleScale = {
    hidden: { scale: 0.98, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1,
        ease: "easeOut",
      },
    },
  };

  const textReveal = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      className="detail"
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={container}
    >
      <div className="detail_grid">
        {/* Nikhil Section */}
        <motion.div className="detail_sm" variants={fadeUp}>
          <motion.div className="mh" variants={gentleScale}>
            <motion.img
              src="https://i.imgur.com/GZX7Ovv.jpeg"
              alt="Nikhil"
              className="detail_img"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          <motion.h2 className="detail_title" variants={fadeUp}>
            Nikhil
          </motion.h2>
          <motion.p className="nana" variants={textReveal}>
            With hearts full of joy and gratitude, we invite you to share in our
            special day as we begin our journey of forever together. Our website
            is designed to provide you with all the information you'll need to
            celebrate alongside us.
          </motion.p>
        </motion.div>

        {/* Shivani Section */}
        <motion.div className="detail_sm" variants={fadeUp}>
          <motion.div className="mh" variants={gentleScale}>
            <motion.img
              src="https://i.imgur.com/odeJr3L.jpeg"
              alt="Shivani"
              className="detail_img"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          <motion.h2 className="detail_title" variants={fadeUp}>
            Shivani
          </motion.h2>
          <motion.p className="nana" variants={textReveal}>
            We're thrilled to have you witness the moment we say "I do" and
            become partners for life. This celebration represents not just our
            love story, but also the beautiful connection between our families,
            friends, and communities who have supported us along the way.
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom Text */}
      <motion.div className="malliya" variants={textReveal}>
        <motion.p className="nana">
          <br />
          <br />
          As you explore these pages, you'll find details about our ceremony,
          reception, logistics, and more. We've created this space to keep you
          informed and to share our excitement as the big day approaches. Thank
          you for being part of our love story.
          <br />
          <br />
          With love and anticipation, Nikhil & Shivani
        </motion.p>
      </motion.div>

      {/* Full-width Image */}
      <motion.div
        className="another_imgs"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{
          opacity: 1,
          y: 0,
          transition: { duration: 1, ease: "easeOut" },
        }}
        viewport={{ once: true, margin: "0px 0px -100px 0px" }}
      >
        <motion.img
          src="https://i.imgur.com/FDS86Ps.jpeg"
          alt="Couple"
          className="another_img"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.4 }}
        />
      </motion.div>
    </motion.div>
  );
};

export default Details;
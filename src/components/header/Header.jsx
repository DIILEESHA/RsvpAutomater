import { motion } from "framer-motion";
import "./header.css";

const Header = () => {
  // Creative animation variants
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.4
      }
    }
  };

  const nameItem = {
    hidden: { 
      opacity: 0,
      y: 40,
      rotate: -5
    },
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
        mass: 0.5
      }
    }
  };

  const letter = {
    hidden: { 
      opacity: 0, 
      y: 40,
      rotate: -10
    },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: {
        delay: i * 0.05,
        type: "spring",
        stiffness: 150,
        damping: 10
      }
    })
  };

  const dateItem = {
    hidden: { 
      opacity: 0,
      y: 30,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.6,
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Split text into letters for animation
  const name = "Nikhil & Shivani";
  const date = "June 24, 2023 · Lake Garda, Italy";

  return (
    <motion.div 
      className="header_container"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <div className="header_content">
        <motion.h1 
          className="couple_name"
          variants={nameItem}
        >
          {name.split("").map((char, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={letter}
              style={{ display: 'inline-block' }}
            >
              {char}
            </motion.span>
          ))}
        </motion.h1>
        
        <motion.p 
          className="actual_place"
          variants={dateItem}
        >
          {date}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Header;
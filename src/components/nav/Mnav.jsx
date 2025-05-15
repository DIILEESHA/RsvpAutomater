import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-scroll";
import "./m.css";

const MNav = () => {
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [forceBackground, setForceBackground] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      const isScrollingUp = prevScrollPos > currentScrollPos;
      const atTop = currentScrollPos < 50;

      setVisible(isScrollingUp || atTop);
      setPrevScrollPos(currentScrollPos);

      // Show background when scrolled or when menu is forced open
      setScrolled(!atTop || forceBackground);

      if (!isScrollingUp && currentScrollPos > 100) {
        setMobileMenuOpen(false);
        setForceBackground(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos, forceBackground]);

  const toggleMobileMenu = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    setForceBackground(newState); // Force background when menu is open
  };

  const navItems = [
    { name: "We're getting married", href: "/", type: "link" },
    { name: "Accomodation", href: "/accommodation", type: "link" },
    { name: "Gallery", href: "/gallery", type: "link" },
    // { name: "RSVP", target: "rsvp", isButton: true, type: "scroll" },
  ];

  return (
    <>
      <motion.div
        className={`mobile_nav ${visible ? "visible" : "hidden"} ${
          scrolled || forceBackground ? "scrolled" : ""
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        <div className="mobile_nav_header">
          <img
            src="https://i.imgur.com/5Hwftj4.png"
            alt="Wedding Logo"
            className="mobile_nav_img"
          />
          <motion.button
            className="hamburger"
            onClick={toggleMobileMenu}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </motion.button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="mobile_nav_menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ul>
                {navItems.map((item) => (
                  <motion.li
                    key={item.name}
                    className={`mobile_nav_li ${
                      item.isButton ? "mobile_sansare" : ""
                    }`}
                    whileHover={{
                      scale: 1.05,
                      color: item.isButton ? "#2c2c2c" : "#e2b34b",
                      backgroundColor: item.isButton ? "#fff" : "transparent",
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.type === "scroll" ? (
                      <Link
                        to={item.target}
                        smooth={true}
                        duration={500}
                        offset={-80}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setForceBackground(false);
                        }}
                        style={{ color: "#fff", textDecoration: "none" }}
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setForceBackground(false);
                        }}
                        style={{ color: "#fff", textDecoration: "none" }}
                      >
                        {item.name}
                      </a>
                    )}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default MNav;

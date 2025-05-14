import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-scroll";
import "./nav.css";

const Nav = () => {
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll behavior for both desktop and mobile
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      const isScrollingUp = prevScrollPos > currentScrollPos;
      
      // Show/hide logic (only hide when scrolling down past 100px)
      setVisible(isScrollingUp || currentScrollPos < 100);
      setPrevScrollPos(currentScrollPos);
      
      // Background color logic (show when scrolled past 50px)
      setScrolled(currentScrollPos > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos]);

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Nav items data
  const navItems = [
    { name: "We're getting married", target: "story" },
    { name: "Accomodation", target: "accomodation" },
    { name: "Gallery", target: "gallery" },
    { name: "RSVP", target: "rsvp", isButton: true }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav 
        className={`nav_side ${visible ? "visible" : "hidden"} ${scrolled ? "scrolled" : ""}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        <div className="nb">
          <div className="nav_sm">
            <ul className="nav_ul">
              {navItems.slice(0, 2).map((item) => (
                <motion.li 
                  key={item.target}
                  className="nav_li"
                  whileHover={{ scale: 1.05, color: "#e2b34b" }}
                >
                  <Link
                    to={item.target}
                    smooth={true}
                    duration={500}
                    offset={-80}
                  >
                    {item.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="nav_sm j">
            <motion.img
              src="https://i.imgur.com/5Hwftj4.png"
              alt="Wedding Logo"
              className="nav_img"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            />
          </div>
          <div className="nav_sm nji">
            <ul className="nav_ul">
              {navItems.slice(2).map((item) => (
                <motion.li 
                  key={item.target}
                  className={`nav_li ${item.isButton ? "sansare" : ""}`}
                  whileHover={{ 
                    scale: 1.05,
                    color: item.isButton ? "#2c2c2c" : "#e2b34b",
                    backgroundColor: item.isButton ? "#fff" : "transparent"
                  }}
                >
                  <Link
                    to={item.target}
                    smooth={true}
                    duration={500}
                    offset={-80}
                  >
                    {item.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation - Now with the same scroll behavior */}
      <motion.div 
        className={`mobile_nav ${visible ? "visible" : "hidden"} ${scrolled ? "scrolled" : ""}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        <div className="mobile_nav_header">
          <motion.img
            src="https://i.imgur.com/5Hwftj4.png"
            alt="Wedding Logo"
            className="mobile_nav_img"
            whileHover={{ scale: 1.05 }}
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
                    key={item.target}
                    className={`mobile_nav_li ${item.isButton ? "mobile_sansare" : ""}`}
                    whileHover={{ 
                      scale: 1.05,
                      color: item.isButton ? "#2c2c2c" : "#e2b34b",
                      backgroundColor: item.isButton ? "#fff" : "transparent"
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to={item.target}
                      smooth={true}
                      duration={500}
                      offset={-80}
                      onClick={toggleMobileMenu}
                    >
                      {item.name}
                    </Link>
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

export default Nav;
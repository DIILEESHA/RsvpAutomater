import { useState, useEffect } from "react";
import "./nav.css";

const Nav = () => {
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      const isScrollingUp = prevScrollPos > currentScrollPos;
      
      setVisible(isScrollingUp || currentScrollPos < 50);
      setPrevScrollPos(currentScrollPos);
      setScrolled(currentScrollPos > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prevScrollPos]);

  return (
    <nav className={`nav_side ${visible ? "visible" : "hidden"} ${scrolled ? "scrolled" : ""}`}>
      <div className="nb">
        <div className="nav_sm">
          <ul className="nav_ul">
            <li className="nav_li">We're getting married</li>
            <li className="nav_li">Accomodation</li>
          </ul>
        </div>
        <div className="nav_sm j">
          <img
            src="https://i.imgur.com/5Hwftj4.png"
            alt="Wedding Logo"
            className="nav_img"
          />
        </div>
        <div className="nav_sm nji">
          <ul className="nav_ul">
            <li className="nav_li">Gallery</li>
            <li className="nav_li sansare">RSVP</li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
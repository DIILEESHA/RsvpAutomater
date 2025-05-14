import React from "react";
import "./home.css";
import Header from "../../components/header/Header";
import Details from "../../components/details/Details";
import Story from "../../components/story/Story";

const Home = () => {
  return (
    <div className="home">
      <Header />
      <Details />
      <Story/>
    </div>
  );
};

export default Home;

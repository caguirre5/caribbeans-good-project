import React from "react";
import Header from "../../components/HeaderControls"
import Footer from "../../components/Footer";
import CreatePostComponent from "./Forum/Post";
import Feed from "./Forum/Feed";

const Forum: React.FC = () => {

  return (
    <div>
      <Header />
        <div 
            className="max-w-4xl mx-auto p-4 mt-20 min-h-[calc(100vh-5rem)]"
        >
            <CreatePostComponent/>
            <Feed/>
        </div>
      <Footer />
    </div>
  );
};

export default Forum;

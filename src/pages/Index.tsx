
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <nav className="flex items-center justify-between mb-16 animate-fade-down">
          <div className="text-xl font-semibold">CaseCat</div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm hover:text-primary/80 transition-colors">Features</a>
            <a href="#about" className="text-sm hover:text-primary/80 transition-colors">About</a>
            <Link 
              to="/upload"
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm hover-up"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="px-3 py-1 rounded-full bg-secondary text-sm inline-block mb-6">
              Welcome to CaseCat
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Elegance in Every Detail
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience design that transforms the ordinary into the extraordinary.
              Built with precision, crafted with care.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/upload"
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground 
                flex items-center gap-2 hover-up"
            >
              Upload Files <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="px-6 py-3 rounded-full border border-border bg-background/50 
              backdrop-blur-sm hover-up">
              Learn More
            </button>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Index;

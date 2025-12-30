declare const __BUILD_DATE__: string;

const Footer = () => {
  const buildDate = __BUILD_DATE__;

  return (
    <footer className="py-6 mt-auto">
      <p className="text-sm text-muted-foreground text-center">
        made by{" "}
        <a
          href="https://www.linkedin.com/in/sandhya-godavarthy-5072622b/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          sandhya
        </a>
        {" "}| last updated: {buildDate}
      </p>
    </footer>
  );
};

export default Footer;

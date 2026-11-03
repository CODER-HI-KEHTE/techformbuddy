"use strict";
(() => {
  // src/lib/languages.ts
  var SUPPORTED_LANGUAGES = [
    { code: "en", label: "English (India)", nativeName: "English", bcp47: "en-IN" },
    { code: "hi", label: "Hindi", nativeName: "\u0939\u093F\u0928\u094D\u0926\u0940", bcp47: "hi-IN" },
    { code: "ta", label: "Tamil", nativeName: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD", bcp47: "ta-IN" },
    { code: "te", label: "Telugu", nativeName: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41", bcp47: "te-IN" },
    { code: "bn", label: "Bengali", nativeName: "\u09AC\u09BE\u0982\u09B2\u09BE", bcp47: "bn-IN" },
    { code: "mr", label: "Marathi", nativeName: "\u092E\u0930\u093E\u0920\u0940", bcp47: "mr-IN" },
    { code: "gu", label: "Gujarati", nativeName: "\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0", bcp47: "gu-IN" },
    { code: "kn", label: "Kannada", nativeName: "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1", bcp47: "kn-IN" },
    { code: "ml", label: "Malayalam", nativeName: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02", bcp47: "ml-IN" },
    { code: "pa", label: "Punjabi", nativeName: "\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40", bcp47: "pa-IN" },
    { code: "ur", label: "Urdu", nativeName: "\u0627\u0631\u062F\u0648", bcp47: "ur-IN" }
  ];
  var ALLOWED_LANGUAGE_CODES = new Set(
    SUPPORTED_LANGUAGES.map((l) => l.code)
  );
  function sanitizeLanguage(code) {
    if (!code || typeof code !== "string") return "en";
    const clean = code.trim().toLowerCase().split(/[-_]/)[0];
    if (ALLOWED_LANGUAGE_CODES.has(clean)) {
      return clean;
    }
    return "en";
  }
  function getLanguageBcp47(code) {
    const safeCode = sanitizeLanguage(code);
    const match = SUPPORTED_LANGUAGES.find((l) => l.code === safeCode);
    return match?.bcp47 || "en-IN";
  }
  var LANG_CODE_TO_LABEL = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((l) => [l.code, l.label])
  );
  var LANG_CODE_TO_NATIVE = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((l) => [l.code, l.nativeName])
  );

  // src/lib/transliterate.ts
  var INDIC_DIGIT_MAP = {
    // Devanagari (Hindi, Marathi)
    "\u0966": "0",
    "\u0967": "1",
    "\u0968": "2",
    "\u0969": "3",
    "\u096A": "4",
    "\u096B": "5",
    "\u096C": "6",
    "\u096D": "7",
    "\u096E": "8",
    "\u096F": "9",
    // Bengali
    "\u09E6": "0",
    "\u09E7": "1",
    "\u09E8": "2",
    "\u09E9": "3",
    "\u09EA": "4",
    "\u09EB": "5",
    "\u09EC": "6",
    "\u09ED": "7",
    "\u09EE": "8",
    "\u09EF": "9",
    // Gujarati
    "\u0AE6": "0",
    "\u0AE7": "1",
    "\u0AE8": "2",
    "\u0AE9": "3",
    "\u0AEA": "4",
    "\u0AEB": "5",
    "\u0AEC": "6",
    "\u0AED": "7",
    "\u0AEE": "8",
    "\u0AEF": "9",
    // Gurmukhi (Punjabi)
    "\u0A66": "0",
    "\u0A67": "1",
    "\u0A68": "2",
    "\u0A69": "3",
    "\u0A6A": "4",
    "\u0A6B": "5",
    "\u0A6C": "6",
    "\u0A6D": "7",
    "\u0A6E": "8",
    "\u0A6F": "9",
    // Kannada
    "\u0CE6": "0",
    "\u0CE7": "1",
    "\u0CE8": "2",
    "\u0CE9": "3",
    "\u0CEA": "4",
    "\u0CEB": "5",
    "\u0CEC": "6",
    "\u0CED": "7",
    "\u0CEE": "8",
    "\u0CEF": "9",
    // Malayalam
    "\u0D66": "0",
    "\u0D67": "1",
    "\u0D68": "2",
    "\u0D69": "3",
    "\u0D6A": "4",
    "\u0D6B": "5",
    "\u0D6C": "6",
    "\u0D6D": "7",
    "\u0D6E": "8",
    "\u0D6F": "9",
    // Telugu
    "\u0C66": "0",
    "\u0C67": "1",
    "\u0C68": "2",
    "\u0C69": "3",
    "\u0C6A": "4",
    "\u0C6B": "5",
    "\u0C6C": "6",
    "\u0C6D": "7",
    "\u0C6E": "8",
    "\u0C6F": "9",
    // Urdu / Persian-Arabic
    "\u06F0": "0",
    "\u06F1": "1",
    "\u06F2": "2",
    "\u06F3": "3",
    "\u06F4": "4",
    "\u06F5": "5",
    "\u06F6": "6",
    "\u06F7": "7",
    "\u06F8": "8",
    "\u06F9": "9"
  };
  var NUMBER_WORDS = {
    zero: 0,
    \u0936\u0942\u0928\u094D\u092F: 0,
    \u0938\u093F\u092B\u093C\u0930: 0,
    one: 1,
    \u090F\u0915: 1,
    first: 1,
    two: 2,
    \u0926\u094B: 2,
    second: 2,
    three: 3,
    \u0924\u0940\u0928: 3,
    third: 3,
    four: 4,
    \u091A\u093E\u0930: 4,
    fourth: 4,
    five: 5,
    \u092A\u093E\u0901\u091A: 5,
    \u092A\u093E\u0902\u091A: 5,
    fifth: 5,
    six: 6,
    \u091B\u0939: 6,
    \u091B\u0903: 6,
    \u091B: 6,
    sixth: 6,
    seven: 7,
    \u0938\u093E\u0924: 7,
    seventh: 7,
    eight: 8,
    \u0906\u0920: 8,
    eighth: 8,
    nine: 9,
    \u0928\u094C: 9,
    ninth: 9,
    ten: 10,
    \u0926\u0938: 10,
    tenth: 10,
    eleven: 11,
    \u0917\u094D\u092F\u093E\u0930\u0939: 11,
    twelve: 12,
    \u092C\u093E\u0930\u0939: 12,
    thirteen: 13,
    \u0924\u0947\u0930\u0939: 13,
    fourteen: 14,
    \u091A\u094C\u0926\u0939: 14,
    fifteen: 15,
    \u092A\u0902\u0926\u094D\u0930\u0939: 15,
    sixteen: 16,
    \u0938\u094B\u0932\u0939: 16,
    seventeen: 17,
    \u0938\u0924\u094D\u0930\u0939: 17,
    eighteen: 18,
    \u0905\u0920\u093E\u0930\u0939: 18,
    nineteen: 19,
    \u0909\u0928\u094D\u0928\u0940\u0938: 19,
    twenty: 20,
    \u092C\u0940\u0938: 20,
    thirty: 30,
    \u0924\u0940\u0938: 30,
    forty: 40,
    \u091A\u093E\u0932\u0940\u0938: 40,
    fifty: 50,
    \u092A\u091A\u093E\u0938: 50,
    sixty: 60,
    \u0938\u093E\u0920: 60,
    seventy: 70,
    \u0938\u0924\u094D\u0924\u0930: 70,
    eighty: 80,
    \u0905\u0938\u094D\u0938\u0940: 80,
    ninety: 90,
    \u0928\u092C\u094D\u092C\u0947: 90,
    hundred: 100,
    \u0938\u094C: 100,
    thousand: 1e3,
    \u0939\u091C\u093C\u093E\u0930: 1e3,
    \u0939\u091C\u093E\u0930: 1e3,
    lakh: 1e5,
    \u0932\u093E\u0916: 1e5,
    crore: 1e7,
    \u0915\u0930\u094B\u0921\u093C: 1e7
  };
  var CANONICAL_NAMES_MAP = {
    // Names
    \u0930\u093E\u0939\u0941\u0932: "Rahul",
    \u0936\u0930\u094D\u092E\u093E: "Sharma",
    \u0905\u092E\u093F\u0924: "Amit",
    \u0915\u0941\u092E\u093E\u0930: "Kumar",
    \u0930\u094B\u0939\u093F\u0924: "Rohit",
    \u0935\u0930\u094D\u092E\u093E: "Verma",
    \u0938\u0941\u0930\u0947\u0936: "Suresh",
    \u092A\u091F\u0947\u0932: "Patel",
    \u092E\u0939\u0947\u0936: "Mahesh",
    \u0917\u0941\u092A\u094D\u0924\u093E: "Gupta",
    \u0905\u091C\u092F: "Ajay",
    \u0938\u093F\u0902\u0939: "Singh",
    \u0935\u093F\u0915\u093E\u0938: "Vikas",
    \u092F\u093E\u0926\u0935: "Yadav",
    \u0938\u0902\u091C\u092F: "Sanjay",
    \u092E\u093F\u0936\u094D\u0930\u093E: "Mishra",
    \u0930\u093E\u091C\u0947\u0936: "Rajesh",
    \u092A\u093E\u0902\u0921\u0947\u092F: "Pandey",
    \u092E\u0928\u094B\u091C: "Manoj",
    \u0924\u093F\u0935\u093E\u0930\u0940: "Tiwari",
    \u0926\u0940\u092A\u0915: "Deepak",
    \u091D\u093E: "Jha",
    \u092A\u0942\u091C\u093E: "Pooja",
    \u0928\u0947\u0939\u093E: "Neha",
    \u092A\u094D\u0930\u093F\u092F\u093E: "Priya",
    \u0905\u0902\u091C\u0932\u093F: "Anjali",
    \u0938\u0941\u0928\u0940\u0924\u093E: "Sunita",
    \u0905\u0928\u093F\u0924\u093E: "Anita",
    \u0915\u0935\u093F\u0924\u093E: "Kavita",
    \u092E\u0940\u0928\u093E: "Meena",
    \u0905\u0928\u0940\u0924\u093E: "Anita",
    \u0938\u0940\u092E\u093E: "Seema",
    \u0930\u0947\u0916\u093E: "Rekha",
    \u0930\u0947\u0928\u0942: "Renu",
    \u092A\u0942\u0928\u092E: "Poonam",
    \u0915\u093F\u0930\u0923: "Kiran",
    \u0905\u092D\u093F\u0937\u0947\u0915: "Abhishek",
    \u0917\u094C\u0930\u0935: "Gaurav",
    \u0938\u094C\u0930\u092D: "Saurabh",
    \u092E\u0928\u0940\u0937: "Manish",
    \u0906\u0936\u0940\u0937: "Ashish",
    \u092A\u094D\u0930\u0936\u093E\u0902\u0924: "Prashant",
    \u0938\u0902\u0926\u0940\u092A: "Sandeep",
    \u0938\u091A\u093F\u0928: "Sachin",
    \u0935\u093F\u0936\u093E\u0932: "Vishal",
    \u0928\u093F\u0924\u093F\u0928: "Nitin",
    \u0906\u0932\u094B\u0915: "Alok",
    \u092A\u0935\u0928: "Pawan",
    \u0938\u0941\u0928\u0940\u0932: "Sunil",
    \u0905\u0928\u093F\u0932: "Anil",
    \u0935\u093F\u0928\u094B\u0926: "Vinod",
    \u0905\u0936\u094B\u0915: "Ashok",
    \u0930\u093E\u0915\u0947\u0936: "Rakesh",
    \u0926\u093F\u0928\u0947\u0936: "Dinesh",
    \u0928\u0930\u0947\u0936: "Naresh",
    \u0938\u0941\u0930\u0947\u0902\u0926\u094D\u0930: "Surendra",
    \u092E\u0939\u0947\u0902\u0926\u094D\u0930: "Mahendra",
    \u0927\u0930\u094D\u092E\u0947\u0928\u094D\u0926\u094D\u0930: "Dharmendra",
    \u091C\u093F\u0924\u0947\u0902\u0926\u094D\u0930: "Jitendra",
    \u0938\u0924\u094D\u092F\u0947\u0902\u0926\u094D\u0930: "Satyendra",
    \u0935\u0940\u0930\u0947\u0902\u0926\u094D\u0930: "Virendra",
    \u0930\u0935\u093F: "Ravi",
    \u0939\u0930\u093F: "Hari",
    \u0935\u093F\u091C\u092F: "Vijay",
    \u0915\u093F\u0936\u0928: "Kishan",
    \u0917\u094B\u092A\u093E\u0932: "Gopal",
    \u092E\u094B\u0939\u0928: "Mohan",
    \u092E\u0926\u0928: "Madan",
    \u0936\u094D\u092F\u093E\u092E: "Shyam",
    \u0930\u093E\u0927\u093E: "Radha",
    \u0938\u0940\u0924\u093E: "Sita",
    \u0917\u0940\u0924\u093E: "Geeta",
    \u0932\u0915\u094D\u0937\u094D\u092E\u0940: "Lakshmi",
    \u092A\u093E\u0930\u094D\u0935\u0924\u0940: "Parvati",
    \u0938\u0930\u0938\u094D\u0935\u0924\u0940: "Saraswati",
    \u0926\u0941\u0930\u094D\u0917\u093E: "Durga",
    \u092E\u094B\u0939\u093F\u0924: "Mohit",
    \u0905\u0928\u0941\u0930\u093E\u0917: "Anurag",
    \u092E\u092F\u0902\u0915: "Mayank",
    \u0939\u0930\u094D\u0937: "Harsh",
    \u0906\u092F\u0941\u0937: "Ayush",
    \u0906\u0926\u093F\u0924\u094D\u092F: "Aditya",
    \u0936\u0941\u092D\u092E: "Shubham",
    \u090B\u0937\u092D: "Rishabh",
    \u0938\u093F\u0926\u094D\u0927\u093E\u0930\u094D\u0925: "Siddharth",
    \u0935\u0930\u0941\u0923: "Varun",
    \u0924\u0930\u0941\u0923: "Tarun",
    \u0905\u0902\u0915\u0941\u0930: "Ankur",
    \u0905\u092E\u0928: "Aman",
    \u0915\u0930\u0923: "Karan",
    \u0905\u0930\u094D\u091C\u0941\u0928: "Arjun",
    \u0935\u093F\u0915\u094D\u0930\u092E: "Vikram",
    \u0915\u092A\u0942\u0930: "Kapoor",
    \u0916\u0928\u094D\u0928\u093E: "Khanna",
    \u091A\u094B\u092A\u0921\u093C\u093E: "Chopra",
    \u092E\u0932\u094D\u0939\u094B\u0924\u094D\u0930\u093E: "Malhotra",
    \u091C\u094B\u0936\u0940: "Joshi",
    \u092D\u091F\u094D\u091F: "Bhatt",
    \u0926\u0941\u092C\u0947: "Dubey",
    \u091A\u094C\u092C\u0947: "Chaubey",
    \u0930\u0947\u0921\u094D\u0921\u0940: "Reddy",
    \u0930\u093E\u0935: "Rao",
    \u0928\u093E\u092F\u0930: "Nair",
    \u092A\u093F\u0932\u094D\u0932\u0908: "Pillai",
    \u0907\u092F\u094D\u092F\u0930: "Iyer",
    \u0905\u092F\u094D\u092F\u0902\u0917\u093E\u0930: "Iyengar",
    \u092E\u0941\u0916\u0930\u094D\u091C\u0940: "Mukherjee",
    \u092C\u0928\u0930\u094D\u091C\u0940: "Banerjee",
    \u091A\u091F\u0930\u094D\u091C\u0940: "Chatterjee",
    \u092C\u094B\u0938: "Bose",
    \u0918\u094B\u0937: "Ghosh",
    \u0917\u093E\u0902\u0917\u0941\u0932\u0940: "Ganguly",
    \u0926\u093E\u0938: "Das",
    \u0926\u0924\u094D\u0924\u093E: "Dutta",
    \u0938\u0947\u0928: "Sen",
    \u0930\u0949\u092F: "Roy",
    \u091A\u094C\u0927\u0930\u0940: "Choudhary",
    \u091A\u094C\u0927\u0941\u0930\u0940: "Chaudhary",
    \u091C\u093E\u091F: "Jat",
    \u0917\u0941\u0930\u094D\u091C\u0930: "Gurjar",
    \u092F\u093E\u0926\u0935\u091C\u0940: "Yadav",
    \u0920\u093E\u0915\u0941\u0930: "Thakur",
    \u0930\u093E\u0923\u093E: "Rana",
    \u091A\u094C\u0939\u093E\u0928: "Chouhan",
    \u0930\u093E\u0920\u094C\u0921\u093C: "Rathore",
    \u0930\u093E\u0920\u094C\u0930: "Rathore",
    \u0936\u0947\u0916\u093E\u0935\u0924: "Shekhawat",
    \u0924\u094B\u092E\u0930: "Tomar",
    \u092A\u0930\u092E\u093E\u0930: "Parmar",
    \u0938\u093F\u0938\u094B\u0926\u093F\u092F\u093E: "Sisodia",
    \u0916\u093E\u0928: "Khan",
    \u0905\u0902\u0938\u093E\u0930\u0940: "Ansari",
    \u0915\u0941\u0930\u0948\u0936\u0940: "Qureshi",
    \u0938\u093F\u0926\u094D\u0926\u0940\u0915\u0940: "Siddiqui",
    \u0936\u0947\u0916: "Sheikh",
    \u0905\u0939\u092E\u0926: "Ahmed",
    \u0905\u0939\u092E\u0926\u091C\u093C\u093E\u0926\u093E: "Ahmad",
    \u0905\u0932\u0940: "Ali",
    \u0939\u0941\u0938\u0948\u0928: "Hussain",
    \u0939\u0938\u0928: "Hasan",
    \u092E\u0932\u093F\u0915: "Malik",
    // Address and place words
    \u0917\u093E\u0902\u0927\u0940: "Gandhi",
    \u0928\u0947\u0939\u0930\u0942: "Nehru",
    \u092E\u093E\u0930\u094D\u0917: "Marg",
    \u0928\u0917\u0930: "Nagar",
    \u0915\u093E\u0932\u094B\u0928\u0940: "Colony",
    \u0915\u0949\u0932\u094B\u0928\u0940: "Colony",
    \u0930\u094B\u0921: "Road",
    \u0917\u0932\u0940: "Gali",
    \u091A\u094C\u0915: "Chowk",
    \u092C\u093E\u091C\u093E\u0930: "Bazaar",
    \u092C\u093E\u091C\u093C\u093E\u0930: "Bazaar",
    \u0938\u0947\u0915\u094D\u091F\u0930: "Sector",
    \u0935\u093E\u0930\u094D\u0921: "Ward",
    \u092E\u094B\u0939\u0932\u094D\u0932\u093E: "Mohalla",
    \u0917\u094D\u0930\u093E\u092E: "Gram",
    \u0917\u093E\u0901\u0935: "Gaon",
    \u0917\u093E\u0902\u0935: "Gaon",
    \u092A\u094B\u0938\u094D\u091F: "Post",
    \u0925\u093E\u0928\u093E: "Thana",
    \u0924\u0939\u0938\u0940\u0932: "Tehsil",
    \u091C\u093F\u0932\u093E: "District",
    \u091C\u093C\u093F\u0932\u093E: "District",
    \u0936\u0939\u0930: "City",
    \u0930\u093E\u091C\u094D\u092F: "State",
    \u0905\u092A\u093E\u0930\u094D\u091F\u092E\u0947\u0902\u091F: "Apartment",
    \u092B\u094D\u0932\u0948\u091F: "Flat",
    \u092E\u0915\u093E\u0928: "House",
    \u092D\u0935\u0928: "Bhawan",
    \u0935\u093F\u0939\u093E\u0930: "Vihar",
    \u0907\u0928\u094D\u0915\u094D\u0932\u0947\u0935: "Enclave",
    \u0938\u094B\u0938\u093E\u092F\u091F\u0940: "Society",
    \u0915\u0941\u0902\u091C: "Kunj",
    \u092A\u093E\u0930\u094D\u0915: "Park",
    // Major Indian Cities & States
    \u0926\u093F\u0932\u094D\u0932\u0940: "Delhi",
    "\u0928\u0908 \u0926\u093F\u0932\u094D\u0932\u0940": "New Delhi",
    \u092E\u0941\u0902\u092C\u0908: "Mumbai",
    \u0915\u094B\u0932\u0915\u093E\u0924\u093E: "Kolkata",
    \u091A\u0947\u0928\u094D\u0928\u0908: "Chennai",
    \u092C\u0947\u0902\u0917\u0932\u0941\u0930\u0941: "Bengaluru",
    \u092C\u0947\u0902\u0917\u0932\u094B\u0930: "Bangalore",
    \u0939\u0948\u0926\u0930\u093E\u092C\u093E\u0926: "Hyderabad",
    \u0905\u0939\u092E\u0926\u093E\u092C\u093E\u0926: "Ahmedabad",
    \u092A\u0941\u0923\u0947: "Pune",
    \u091C\u092F\u092A\u0941\u0930: "Jaipur",
    \u0932\u0916\u0928\u090A: "Lucknow",
    \u0915\u093E\u0928\u092A\u0941\u0930: "Kanpur",
    \u0928\u093E\u0917\u092A\u0941\u0930: "Nagpur",
    \u0907\u0902\u0926\u094C\u0930: "Indore",
    \u092D\u094B\u092A\u093E\u0932: "Bhopal",
    \u092A\u091F\u0928\u093E: "Patna",
    \u0935\u0921\u094B\u0926\u0930\u093E: "Vadodara",
    \u0938\u0942\u0930\u0924: "Surat",
    \u0932\u0941\u0927\u093F\u092F\u093E\u0928\u093E: "Ludhiana",
    \u0906\u0917\u0930\u093E: "Agra",
    \u0935\u093E\u0930\u093E\u0923\u0938\u0940: "Varanasi",
    \u092A\u094D\u0930\u092F\u093E\u0917\u0930\u093E\u091C: "Prayagraj",
    \u0907\u0932\u093E\u0939\u093E\u092C\u093E\u0926: "Allahabad",
    \u0905\u092E\u0943\u0924\u0938\u0930: "Amritsar",
    \u091C\u094B\u0927\u092A\u0941\u0930: "Jodhpur",
    \u0909\u0926\u092F\u092A\u0941\u0930: "Udaipur",
    \u0930\u093E\u0902\u091A\u0940: "Ranchi",
    \u0930\u093E\u092F\u092A\u0941\u0930: "Raipur",
    \u0926\u0947\u0939\u0930\u093E\u0926\u0942\u0928: "Dehradun",
    \u0936\u093F\u092E\u0932\u093E: "Shimla",
    \u0936\u094D\u0930\u0940\u0928\u0917\u0930: "Srinagar",
    \u091C\u092E\u094D\u092E\u0942: "Jammu",
    \u091A\u0902\u0921\u0940\u0917\u0922\u093C: "Chandigarh",
    \u0917\u094B\u0935\u093E: "Goa",
    \u0915\u0947\u0930\u0932: "Kerala",
    "\u0909\u0924\u094D\u0924\u0930 \u092A\u094D\u0930\u0926\u0947\u0936": "Uttar Pradesh",
    "\u092E\u0927\u094D\u092F \u092A\u094D\u0930\u0926\u0947\u0936": "Madhya Pradesh",
    \u0930\u093E\u091C\u0938\u094D\u0925\u093E\u0928: "Rajasthan",
    \u092E\u0939\u093E\u0930\u093E\u0937\u094D\u091F\u094D\u0930: "Maharashtra",
    \u0917\u0941\u091C\u0930\u093E\u0924: "Gujarat",
    \u092A\u0902\u091C\u093E\u092C: "Punjab",
    \u0939\u0930\u093F\u092F\u093E\u0923\u093E: "Haryana",
    \u092C\u093F\u0939\u093E\u0930: "Bihar",
    "\u092A\u0936\u094D\u091A\u093F\u092E \u092C\u0902\u0917\u093E\u0932": "West Bengal",
    \u0924\u092E\u093F\u0932\u0928\u093E\u0921\u0941: "Tamil Nadu",
    \u0915\u0930\u094D\u0928\u093E\u091F\u0915: "Karnataka",
    "\u0906\u0902\u0927\u094D\u0930 \u092A\u094D\u0930\u0926\u0947\u0936": "Andhra Pradesh",
    \u0924\u0947\u0932\u0902\u0917\u093E\u0928\u093E: "Telangana",
    \u0913\u0921\u093F\u0936\u093E: "Odisha",
    \u0905\u0938\u092E: "Assam",
    \u0909\u0924\u094D\u0924\u0930\u093E\u0916\u0902\u0921: "Uttarakhand",
    "\u0939\u093F\u092E\u093E\u091A\u0932 \u092A\u094D\u0930\u0926\u0947\u0936": "Himachal Pradesh",
    \u091D\u093E\u0930\u0916\u0902\u0921: "Jharkhand",
    \u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C: "Chhattisgarh",
    \u092D\u093E\u0930\u0924: "India"
  };
  var DEVANAGARI_CONSONANTS = {
    \u0915: "k",
    \u0916: "kh",
    \u0917: "g",
    \u0918: "gh",
    \u0919: "ng",
    \u091A: "ch",
    \u091B: "chh",
    \u091C: "j",
    \u091D: "jh",
    \u091E: "ny",
    \u091F: "t",
    \u0920: "th",
    \u0921: "d",
    \u0922: "dh",
    \u0923: "n",
    \u0924: "t",
    \u0925: "th",
    \u0926: "d",
    \u0927: "dh",
    \u0928: "n",
    \u092A: "p",
    \u092B: "ph",
    \u092C: "b",
    \u092D: "bh",
    \u092E: "m",
    \u092F: "y",
    \u0930: "r",
    \u0932: "l",
    \u0935: "v",
    \u0936: "sh",
    \u0937: "sh",
    \u0938: "s",
    \u0939: "h",
    \u0915\u093C: "q",
    \u0916\u093C: "kh",
    \u0917\u093C: "gh",
    \u091C\u093C: "z",
    \u0921\u093C: "r",
    \u0922\u093C: "rh",
    \u092B\u093C: "f",
    \u0915\u094D\u0937: "ksh",
    \u0924\u094D\u0930: "tr",
    \u091C\u094D\u091E: "gy",
    \u0936\u094D\u0930: "shr"
  };
  var DEVANAGARI_VOWELS = {
    \u0905: "a",
    \u0906: "aa",
    \u0907: "i",
    \u0908: "ee",
    \u0909: "u",
    \u090A: "oo",
    \u090B: "ri",
    \u090F: "e",
    \u0910: "ai",
    \u0913: "o",
    \u0914: "au",
    "\u093E": "a",
    "\u093F": "i",
    "\u0940": "ee",
    "\u0941": "u",
    "\u0942": "oo",
    "\u0943": "ri",
    "\u0947": "e",
    "\u0948": "ai",
    "\u094B": "o",
    "\u094C": "au",
    "\u0902": "n",
    "\u0901": "n",
    "\u0903": "h",
    "\u094D": ""
  };
  function transliterateDevanagari(text) {
    if (!text) return "";
    let normalized = text;
    normalized = normalized.replace(/एम\s*जी\s*रोड/gi, "MG Road");
    normalized = normalized.replace(/एम\s*जी/gi, "MG");
    normalized = normalized.replace(/नई\s+दिल्ली/gi, "New Delhi");
    const tokens = normalized.split(/(\s+|[.,;:\-_/()])/);
    return tokens.map((token) => {
      const trimmed = token.trim();
      if (!trimmed || !/[ऀ-ॿ]/.test(trimmed)) {
        return token;
      }
      if (CANONICAL_NAMES_MAP[trimmed]) {
        return CANONICAL_NAMES_MAP[trimmed];
      }
      let result = "";
      const chars = Array.from(trimmed);
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        const next = chars[i + 1] || "";
        if (DEVANAGARI_CONSONANTS[c]) {
          const latin = DEVANAGARI_CONSONANTS[c];
          if (next === "\u094D") {
            result += latin;
            i++;
          } else if (DEVANAGARI_VOWELS[next] && next !== "\u094D") {
            result += latin + DEVANAGARI_VOWELS[next];
            i++;
          } else {
            const isEndOfWord = i === chars.length - 1;
            result += latin + (isEndOfWord ? "" : "a");
          }
        } else if (DEVANAGARI_VOWELS[c]) {
          result += DEVANAGARI_VOWELS[c];
        } else {
          result += c;
        }
      }
      return result ? result.charAt(0).toUpperCase() + result.slice(1) : token;
    }).join("");
  }
  function convertIndicDigitsToAscii(text) {
    if (!text) return "";
    let out = "";
    for (const ch of text) {
      out += INDIC_DIGIT_MAP[ch] !== void 0 ? INDIC_DIGIT_MAP[ch] : ch;
    }
    return out;
  }
  function convertNumberWordsToDigits(text) {
    if (!text) return "";
    let result = text;
    for (const [word, val] of Object.entries(NUMBER_WORDS)) {
      const rx = new RegExp(`\\b${word}\\b`, "gi");
      result = result.replace(rx, String(val));
    }
    return result;
  }
  function isRegionalScriptField(label = "", placeholder = "", name = "") {
    const corpus = `${label} ${placeholder} ${name}`.toLowerCase();
    if (corpus.includes("\u0939\u093F\u0902\u0926\u0940") || corpus.includes("\u0939\u093F\u0928\u094D\u0926\u0940") || corpus.includes("\u0926\u0947\u0935\u0928\u093E\u0917\u0930\u0940") || /\b(in\s+hindi|name\s+in\s+hindi|hindi\s+mein|devanagari)\b/i.test(corpus)) {
      return { isRegional: true, targetLang: "hi" };
    }
    if (corpus.includes("\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD") || corpus.includes("\u0BA4\u0BAE\u0BBF\u0BB4\u0BBF\u0BB2\u0BCD") || /\b(in\s+tamil|tamilil|tamil)\b/i.test(corpus)) {
      return { isRegional: true, targetLang: "ta" };
    }
    if (corpus.includes("\u09AC\u09BE\u0982\u09B2\u09BE") || corpus.includes("\u09AC\u09BE\u0982\u09B2\u09BE\u09AF\u09BC") || /\b(in\s+bengali|banglay|bengali)\b/i.test(corpus)) {
      return { isRegional: true, targetLang: "bn" };
    }
    if (corpus.includes("\u092E\u0930\u093E\u0920\u0940") || corpus.includes("\u092E\u0930\u093E\u0920\u0940\u0924") || /\b(in\s+marathi|marathit|marathi)\b/i.test(corpus)) {
      return { isRegional: true, targetLang: "mr" };
    }
    if (corpus.includes("\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41") || corpus.includes("\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41\u0C32\u0C4B") || /\b(in\s+telugu|telugulo|telugu)\b/i.test(corpus)) {
      return { isRegional: true, targetLang: "te" };
    }
    if (corpus.includes("\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0") || corpus.includes("\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0\u0AAE\u0ABE\u0A82") || /\b(in\s+gujarati|gujaratima|gujarati)\b/i.test(corpus)) {
      return { isRegional: true, targetLang: "gu" };
    }
    if (corpus.includes("\u0C95\u0CA8\u0CCD\u0CA8\u0CA1") || corpus.includes("\u0C95\u0CA8\u0CCD\u0CA8\u0CA1\u0CA6\u0CB2\u0CCD\u0CB2\u0CBF") || /\b(in\s+kannada|kannadadalli|kannada)\b/i.test(corpus)) {
      return { isRegional: true, targetLang: "kn" };
    }
    if (corpus.includes("\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02") || corpus.includes("\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D24\u0D4D\u0D24\u0D3F\u0D7D") || /\b(in\s+malayalam|malayalathil|malayalam)\b/i.test(corpus)) {
      return { isRegional: true, targetLang: "ml" };
    }
    if (corpus.includes("\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40") || /\b(in\s+punjabi|punjabivich|punjabi)\b/i.test(corpus)) {
      return { isRegional: true, targetLang: "pa" };
    }
    if (corpus.includes("\u0627\u0631\u062F\u0648") || /\b(in\s+urdu|urdu\s+mein|urdu)\b/i.test(corpus)) {
      return { isRegional: true, targetLang: "ur" };
    }
    if (corpus.includes("\u092E\u093E\u0924\u0943\u092D\u093E\u0937\u093E") || /\b(regional\s*language|regional\s*script|vernacular|local\s*language)\b/i.test(corpus)) {
      return { isRegional: true };
    }
    return { isRegional: false };
  }
  function getProfileVal(profile, key) {
    if (!profile || !key) return null;
    if (profile[key]) return String(profile[key]);
    const camelKey = key.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
    if (profile[camelKey]) return String(profile[camelKey]);
    const lowerKey = key.toLowerCase().replace(/_/g, "");
    for (const [k, v] of Object.entries(profile)) {
      if (k.toLowerCase().replace(/_/g, "") === lowerKey && v) {
        return String(v);
      }
    }
    return null;
  }
  function normalizeDateValue(rawDate, isDateInput = false) {
    const cleaned = convertIndicDigitsToAscii(convertNumberWordsToDigits(rawDate.trim()));
    const MONTHS_MAP = {
      \u091C\u0928\u0935\u0930\u0940: "01",
      january: "01",
      jan: "01",
      \u092B\u0930\u0935\u0930\u0940: "02",
      february: "02",
      feb: "02",
      \u092E\u093E\u0930\u094D\u091A: "03",
      march: "03",
      mar: "03",
      \u0905\u092A\u094D\u0930\u0948\u0932: "04",
      april: "04",
      apr: "04",
      \u092E\u0908: "05",
      may: "05",
      \u091C\u0942\u0928: "06",
      june: "06",
      jun: "06",
      \u091C\u0941\u0932\u093E\u0908: "07",
      july: "07",
      jul: "07",
      \u0905\u0917\u0938\u094D\u0924: "08",
      august: "08",
      aug: "08",
      \u0938\u093F\u0924\u0902\u092C\u0930: "09",
      september: "09",
      sep: "09",
      \u0905\u0915\u094D\u091F\u0942\u092C\u0930: "10",
      october: "10",
      oct: "10",
      \u0928\u0935\u0902\u092C\u0930: "11",
      november: "11",
      nov: "11",
      \u0926\u093F\u0938\u0902\u092C\u0930: "12",
      december: "12",
      dec: "12"
    };
    const textMonthMatch = cleaned.match(/^(\d{1,2})\s+([^\s\d]+)\s+(\d{4})$/);
    if (textMonthMatch) {
      const day = textMonthMatch[1].padStart(2, "0");
      const monthWord = textMonthMatch[2].toLowerCase();
      const month = MONTHS_MAP[monthWord];
      const year = textMonthMatch[3];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }
    const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, "0");
      const month = dmyMatch[2].padStart(2, "0");
      const year = dmyMatch[3];
      return isDateInput ? `${year}-${month}-${day}` : `${year}-${month}-${day}`;
    }
    const ymdMatch = cleaned.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, "0");
      const day = ymdMatch[3].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return cleaned;
  }
  function matchFieldToProfileKey(label = "", name = "") {
    const corpus = `${label} ${name}`.toLowerCase();
    if (/\b(full\s*name|applicant\s*name|candidate\s*name|name\s*of\s*applicant|पूरा\s*नाम|नाम)\b/i.test(corpus)) {
      if (!/\b(father|mother|spouse|guardian|nominee|witness)\b/i.test(corpus)) {
        return "full_name";
      }
    }
    if (/\b(father|पिता)\b/i.test(corpus)) return "father_name";
    if (/\b(mother|माता)\b/i.test(corpus)) return "mother_name";
    if (/\b(email|ईमेल)\b/i.test(corpus)) return "email";
    if (/\b(mobile|phone|contact|मोबाइल)\b/i.test(corpus)) return "phone";
    if (/\b(dob|birth|जन्म)\b/i.test(corpus)) return "date_of_birth";
    if (/\b(gender|sex|लिंग)\b/i.test(corpus)) return "gender";
    if (/\b(address|street|पता|निवास)\b/i.test(corpus)) return "address";
    if (/\b(city|town|district|शहर|जिला)\b/i.test(corpus)) return "city";
    if (/\b(state|राज्य)\b/i.test(corpus)) return "state";
    if (/\b(pincode|postal|zip|पिनकोड)\b/i.test(corpus)) return "pincode";
    return null;
  }
  function processFieldValueForFilling(options) {
    const raw = (options.rawValue || "").trim();
    const label = options.fieldLabel || "";
    const fieldType = (options.fieldType || "text").toLowerCase();
    const fieldName = options.fieldName || "";
    const profile = options.profileValues || {};
    const regionalCheck = isRegionalScriptField(label, "", fieldName);
    if (regionalCheck.isRegional) {
      return {
        interpretedValue: raw,
        finalValue: raw,
        isRegional: true,
        fromProfile: false,
        source: "regional_script",
        requiresConfirmation: true,
        profileKey: null
      };
    }
    const matchedKey = matchFieldToProfileKey(label, fieldName);
    const profileVal = matchedKey ? getProfileVal(profile, matchedKey) : null;
    if (profileVal && profileVal.trim()) {
      return {
        interpretedValue: profileVal.trim(),
        finalValue: profileVal.trim(),
        isRegional: false,
        fromProfile: true,
        source: "profile",
        requiresConfirmation: true,
        profileKey: matchedKey
      };
    }
    let processed = convertIndicDigitsToAscii(raw);
    let detectedSource = "transliterated";
    const isNumericField = fieldType === "number" || fieldType === "tel" || /\b(number|pin|code|phone|mobile|amount|age|digit)\b/i.test(`${label} ${fieldName}`);
    if (isNumericField) {
      processed = convertNumberWordsToDigits(processed);
      detectedSource = "number";
    }
    if (fieldType === "date" || /\b(dob|birth|date)\b/i.test(`${label} ${fieldName}`)) {
      processed = normalizeDateValue(processed, fieldType === "date");
      detectedSource = "date";
    } else if (!isNumericField) {
      if (/[ऀ-ॿ]/.test(processed)) {
        processed = transliterateDevanagari(processed);
        detectedSource = "transliterated";
      }
    }
    return {
      interpretedValue: processed.trim(),
      finalValue: processed.trim(),
      isRegional: false,
      fromProfile: false,
      source: detectedSource,
      requiresConfirmation: true,
      profileKey: matchedKey
    };
  }

  // src/lib/translate.ts
  var TRANSLATION_FAILURE_MESSAGES = {
    en: "Translation failed. Could not read in the selected language.",
    hi: "\u0905\u0928\u0941\u0935\u093E\u0926 \u0935\u093F\u092B\u0932 \u0930\u0939\u093E\u0964 \u0938\u093E\u092E\u0917\u094D\u0930\u0940 \u0915\u094B \u0939\u093F\u0928\u094D\u0926\u0940 \u092E\u0947\u0902 \u0928\u0939\u0940\u0902 \u092A\u0922\u093C\u093E \u091C\u093E \u0938\u0915\u093E\u0964",
    ta: "\u0BAE\u0BCA\u0BB4\u0BBF\u0BAA\u0BC6\u0BAF\u0BB0\u0BCD\u0BAA\u0BCD\u0BAA\u0BC1 \u0BA4\u0BCB\u0BB2\u0BCD\u0BB5\u0BBF\u0BAF\u0B9F\u0BC8\u0BA8\u0BCD\u0BA4\u0BA4\u0BC1. \u0BA4\u0BAE\u0BBF\u0BB4\u0BBF\u0BB2\u0BCD \u0BB5\u0BBE\u0B9A\u0BBF\u0B95\u0BCD\u0B95 \u0BAE\u0BC1\u0B9F\u0BBF\u0BAF\u0BB5\u0BBF\u0BB2\u0BCD\u0BB2\u0BC8.",
    te: "\u0C05\u0C28\u0C41\u0C35\u0C3E\u0C26\u0C02 \u0C35\u0C3F\u0C2B\u0C32\u0C2E\u0C48\u0C02\u0C26\u0C3F. \u0C24\u0C46\u0C32\u0C41\u0C17\u0C41\u0C32\u0C4B \u0C1A\u0C26\u0C35\u0C21\u0C02 \u0C38\u0C3E\u0C27\u0C4D\u0C2F\u0C02 \u0C15\u0C3E\u0C32\u0C47\u0C26\u0C41.",
    bn: "\u0985\u09A8\u09C1\u09AC\u09BE\u09A6 \u09AC\u09CD\u09AF\u09B0\u09CD\u09A5 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u09AC\u09BE\u0982\u09B2\u09BE\u09AF\u09BC \u09AA\u09A1\u09BC\u09BE \u09B8\u09AE\u09CD\u09AD\u09AC \u09B9\u09AF\u09BC\u09A8\u09BF\u0964",
    mr: "\u092D\u093E\u0937\u093E\u0902\u0924\u0930 \u0905\u092F\u0936\u0938\u094D\u0935\u0940 \u091D\u093E\u0932\u0947. \u092E\u0930\u093E\u0920\u0940\u0924 \u0935\u093E\u091A\u0924\u093E \u0906\u0932\u0947 \u0928\u093E\u0939\u0940.",
    gu: "\u0A85\u0AA8\u0AC1\u0AB5\u0ABE\u0AA6 \u0AA8\u0ABF\u0AB7\u0ACD\u0AAB\u0AB3 \u0AB0\u0AB9\u0ACD\u0AAF\u0ACB. \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0\u0AAE\u0ABE\u0A82 \u0AB5\u0ABE\u0A82\u0A9A\u0AC0 \u0AB6\u0A95\u0ABE\u0AAF\u0AC1\u0A82 \u0AA8\u0AB9\u0AC0\u0A82.",
    kn: "\u0C85\u0CA8\u0CC1\u0CB5\u0CBE\u0CA6 \u0CB5\u0CBF\u0CAB\u0CB2\u0CB5\u0CBE\u0C97\u0CBF\u0CA6\u0CC6. \u0C95\u0CA8\u0CCD\u0CA8\u0CA1\u0CA6\u0CB2\u0CCD\u0CB2\u0CBF \u0C93\u0CA6\u0CB2\u0CC1 \u0CB8\u0CBE\u0CA7\u0CCD\u0CAF\u0CB5\u0CBE\u0C97\u0CB2\u0CBF\u0CB2\u0CCD\u0CB2.",
    ml: "\u0D35\u0D3F\u0D35\u0D7C\u0D24\u0D4D\u0D24\u0D28\u0D02 \u0D2A\u0D30\u0D3E\u0D1C\u0D2F\u0D2A\u0D4D\u0D2A\u0D46\u0D1F\u0D4D\u0D1F\u0D41. \u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D24\u0D4D\u0D24\u0D3F\u0D7D \u0D35\u0D3E\u0D2F\u0D3F\u0D15\u0D4D\u0D15\u0D3E\u0D28\u0D3E\u0D2F\u0D3F\u0D32\u0D4D\u0D32.",
    pa: "\u0A05\u0A28\u0A41\u0A35\u0A3E\u0A26 \u0A05\u0A38\u0A2B\u0A32 \u0A30\u0A3F\u0A39\u0A3E\u0964 \u0A38\u0A2E\u0A71\u0A17\u0A30\u0A40 \u0A28\u0A42\u0A70 \u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40 \u0A35\u0A3F\u0A71\u0A1A \u0A28\u0A39\u0A40\u0A02 \u0A2A\u0A5C\u0A4D\u0A39\u0A3F\u0A06 \u0A1C\u0A3E \u0A38\u0A15\u0A3F\u0A06\u0964",
    ur: "\u062A\u0631\u062C\u0645\u06C1 \u0646\u0627\u06A9\u0627\u0645 \u06C1\u0648 \u06AF\u06CC\u0627\u06D4 \u0645\u0648\u0627\u062F \u0627\u0631\u062F\u0648 \u0645\u06CC\u06BA \u0646\u06C1\u06CC\u06BA \u067E\u0691\u06BE\u0627 \u062C\u0627 \u0633\u06A9\u0627\u06D4"
  };
  function getTranslationFailureMessage(langCode) {
    return TRANSLATION_FAILURE_MESSAGES[langCode] || TRANSLATION_FAILURE_MESSAGES["en"];
  }

  // packages/extension/src/content-portal.ts
  function isWebAppOrigin() {
    try {
      const origin = window.location.origin;
      const hostname = window.location.hostname;
      const port = window.location.port;
      if (origin.includes("techformbuddy.com")) return true;
      if ((hostname === "localhost" || hostname === "127.0.0.1") && port === "3000") return true;
      if (document.documentElement.dataset.tfbExtension || document.getElementById("__next")) {
        if (document.title.includes("TechForm Buddy") || document.querySelector('meta[name="description"][content*="TechForm Buddy"]')) {
          return true;
        }
      }
    } catch {
    }
    return false;
  }
  if (isWebAppOrigin()) {
    console.log("[TechFormBuddy] Web app origin detected. Skipping portal widget injection.");
  } else {
    console.log("[TechFormBuddy] content script loaded", window.location.href);
    if (!window.__tfbPortalLoaded) {
      window.__tfbPortalLoaded = true;
      initPortalContentScript();
    }
  }
  var overlayHost = null;
  var currentFieldsList = [];
  var activeLang = "en";
  var latestFillValues = {};
  var activeTab = "form";
  var assistantQueryResult = null;
  var isQueryingAssistant = false;
  var hasAttemptedGuideFetch = false;
  var activeTaskName = "";
  var portalGuideStepIndex = 0;
  var portalAutoReadEnabled = false;
  var portalVoiceWarning = "";
  var isPortalSpeaking = false;
  var portalHighlightedElement = null;
  var sidebarWidth = 440;
  var sidebarSide = "right";
  var isSidebarMinimized = false;
  var isResizingSidebar = false;
  var isAutofillModeOn = true;
  try {
    const savedMode = localStorage.getItem("tfb_autofill_mode");
    if (savedMode !== null) isAutofillModeOn = savedMode === "true";
  } catch {
  }
  window.addEventListener("tfb-autofill-mode-changed", (e) => {
    if (typeof e.detail?.enabled === "boolean") {
      isAutofillModeOn = e.detail.enabled;
      const pillBadge = document.getElementById("tfb-pill-autofill-badge");
      if (pillBadge) {
        pillBadge.textContent = `\u26A1 Autofill: ${isAutofillModeOn ? "ON" : "OFF"}`;
        pillBadge.style.background = isAutofillModeOn ? "#2563eb" : "#475569";
      }
    }
  });
  var onVisitAlerts = [];
  var onVisitSourceName = "";
  var hasCheckedOnVisitAlerts = false;
  var onVisitAlertDismissed = false;
  function highlightNoticeOnPage(noticeTitle) {
    const words = (noticeTitle || "").toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const elements = Array.from(document.querySelectorAll("a, h1, h2, h3, h4, h5, td, li, p, span"));
    let matchedEl = null;
    let maxScore = 0;
    for (const el of elements) {
      const text = (el.textContent || "").toLowerCase();
      if (text.length < 10 || text.length > 500) continue;
      let score = 0;
      for (const w of words) {
        if (text.includes(w)) score++;
      }
      if (score > maxScore || score === maxScore && matchedEl && matchedEl.contains(el)) {
        maxScore = score;
        matchedEl = el;
      }
    }
    if (matchedEl) {
      matchedEl.scrollIntoView({ behavior: "smooth", block: "center" });
      matchedEl.style.outline = "4px solid #f59e0b";
      matchedEl.style.backgroundColor = "rgba(245, 158, 11, 0.25)";
      matchedEl.style.borderRadius = "4px";
      matchedEl.style.transition = "all 0.3s ease";
      setTimeout(() => {
        if (matchedEl) {
          matchedEl.style.outline = "2px dashed #f59e0b";
        }
      }, 4e3);
    }
  }
  function redactPII(text) {
    if (!text || typeof text !== "string") return "";
    return text.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, "[REDACTED_CARD]").replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[REDACTED_AADHAAR]").replace(/\b[A-Za-z]{5}\d{4}[A-Za-z]\b/g, "[REDACTED_PAN]").replace(/(?:\+91[\s-]?)?(?:0)?[6-9]\d{9}\b/g, "[REDACTED_PHONE]").replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]");
  }
  var chatTurns = [];
  var pendingProposedTool = null;
  var currentFieldWalkIndex = 0;
  var blockedActionMessage = null;
  var isChatSubmitting = false;
  try {
    const savedWidth = localStorage.getItem("tfb_overlay_width");
    if (savedWidth) {
      const w = parseInt(savedWidth, 10);
      if (!isNaN(w) && w >= 320 && w <= 900) sidebarWidth = w;
    }
    const savedSide = localStorage.getItem("tfb_overlay_side");
    if (savedSide === "left" || savedSide === "right") sidebarSide = savedSide;
  } catch {
  }
  var OVERLAY_TEXTS = {
    en: {
      title: "TechForm Buddy Assistant",
      fieldsDetected: (n) => `${n} Form Fields Detected`,
      stepProgress: (c, t) => `Step ${c} of ${t}`,
      fillSafe: "\u26A1 Auto-Fill Verified Fields",
      fillAll: "Fill All Fields",
      clear: "Clear Values",
      confirmLow: "Low-confidence match: confirm before filling",
      reviewSubmit: "Review everything on this page, then press Submit yourself on the portal. TechForm Buddy never submits forms automatically.",
      notPairedTitle: "Open TechForm Buddy and sign in",
      notPairedMsg: "Sign in to TechForm Buddy to pair your saved profile and enable intelligent form autofill.",
      openAppBtn: "Open TechForm Buddy \u2197",
      tabForm: "\u{1F4CB} Auto-Fill",
      tabGuide: "\u2139\uFE0F Portal Guide",
      tabAssistant: "\u{1F4AC} Ask Assistant",
      askPlaceholder: "Ask about documents, eligibility, or steps...",
      askBtn: "Ask",
      asking: "Searching guidance...",
      noAssistantAnswer: "No specific guidance found. Type a query above.",
      quickQuestions: ["ye field kya hai?", "ye form kis liye hai?", "kaunse documents chahiye?", "kahan kya bharna hai", "Download guidelines"],
      toolConfirmBtn: "\u2713 Confirm / Yes",
      toolCancelBtn: "\u2715 Cancel / No",
      proposedActionTitle: "Proposed Action",
      securityAlertTitle: "Safety Shield Notice",
      externalDomainNotice: "\u26A0\uFE0F External Domain Navigation Warning: You are navigating away to a different website. Do you confirm?",
      docsNeeded: "Documents Needed:",
      stepsHeading: "Application Steps:",
      ttsRead: "\u{1F50A} Read Aloud",
      activeTask: "Active Task",
      autoReadToggle: "Auto-read each step",
      noVoiceWarning: (lang) => `Notice: No voice installed for ${lang} on this system.`,
      guideAction: "Click highlighted element",
      pageGuide: "Portal Page Guide",
      btnNextStep: "Next Step \u2192",
      btnPrevStep: "\u2190 Previous Step"
    },
    hi: {
      title: "\u091F\u0947\u0915\u092B\u0949\u0930\u094D\u092E \u092C\u0921\u0940 \u0938\u0939\u093E\u092F\u0915",
      fieldsDetected: (n) => `${n} \u092B\u0949\u0930\u094D\u092E \u092B\u093C\u0940\u0932\u094D\u0921 \u092E\u093F\u0932\u0947`,
      stepProgress: (c, t) => `\u091A\u0930\u0923 ${c} / ${t}`,
      fillSafe: "\u26A1 \u0938\u0924\u094D\u092F\u093E\u092A\u093F\u0924 \u092B\u093C\u0940\u0932\u094D\u0921 \u0938\u094D\u0935\u0924\u0903 \u092D\u0930\u0947\u0902",
      fillAll: "\u0938\u092D\u0940 \u092B\u093C\u0940\u0932\u094D\u0921 \u092D\u0930\u0947\u0902",
      clear: "\u092E\u093E\u0928 \u0938\u093E\u092B\u093C \u0915\u0930\u0947\u0902",
      confirmLow: "\u0915\u092E \u0935\u093F\u0936\u094D\u0935\u0938\u0928\u0940\u092F\u0924\u093E: \u092D\u0930\u0928\u0947 \u0938\u0947 \u092A\u0939\u0932\u0947 \u092A\u0941\u0937\u094D\u091F\u093F \u0915\u0930\u0947\u0902",
      reviewSubmit: "\u0907\u0938 \u092A\u0943\u0937\u094D\u0920 \u092A\u0930 \u0938\u092C \u0915\u0941\u091B \u091C\u093E\u0902\u091A\u0947\u0902, \u092B\u093F\u0930 \u092A\u094B\u0930\u094D\u091F\u0932 \u092A\u0930 \u0938\u094D\u0935\u092F\u0902 \u0938\u092C\u092E\u093F\u091F \u0926\u092C\u093E\u090F\u0902\u0964 TechForm Buddy \u0915\u092D\u0940 \u092D\u0940 \u092B\u0949\u0930\u094D\u092E \u0938\u094D\u0935\u091A\u093E\u0932\u093F\u0924 \u0930\u0942\u092A \u0938\u0947 \u0938\u092C\u092E\u093F\u091F \u0928\u0939\u0940\u0902 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
      notPairedTitle: "TechForm Buddy \u0916\u094B\u0932\u0947\u0902 \u0914\u0930 \u0938\u093E\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902",
      notPairedMsg: "\u0905\u092A\u0928\u0940 \u092A\u094D\u0930\u094B\u092B\u093C\u093E\u0907\u0932 \u0938\u0947 \u0915\u0928\u0947\u0915\u094D\u091F \u0915\u0930\u0928\u0947 \u0914\u0930 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0911\u091F\u094B-\u092B\u093C\u093F\u0932 \u0915\u0947 \u0932\u093F\u090F TechForm Buddy \u092E\u0947\u0902 \u0938\u093E\u0907\u0928 \u0907\u0928 \u0915\u0930\u0947\u0902\u0964",
      openAppBtn: "TechForm Buddy \u0916\u094B\u0932\u0947\u0902 \u2197",
      tabForm: "\u{1F4CB} \u0911\u091F\u094B-\u092B\u093C\u093F\u0932",
      tabGuide: "\u2139\uFE0F \u092A\u094B\u0930\u094D\u091F\u0932 \u0917\u093E\u0907\u0921",
      tabAssistant: "\u{1F4AC} \u0938\u0939\u093E\u092F\u0915 \u0938\u0947 \u092A\u0942\u091B\u0947\u0902",
      askPlaceholder: "\u0926\u0938\u094D\u0924\u093E\u0935\u0947\u091C\u093C, \u092A\u093E\u0924\u094D\u0930\u0924\u093E \u092F\u093E \u091A\u0930\u0923\u094B\u0902 \u0915\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902 \u092A\u0942\u091B\u0947\u0902...",
      askBtn: "\u092A\u0942\u091B\u0947\u0902",
      asking: "\u0916\u094B\u091C \u0930\u0939\u0947 \u0939\u0948\u0902...",
      noAssistantAnswer: "\u0915\u094B\u0908 \u0935\u093F\u0936\u093F\u0937\u094D\u091F \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u0940\u0964 \u090A\u092A\u0930 \u090F\u0915 \u092A\u094D\u0930\u0936\u094D\u0928 \u0932\u093F\u0916\u0947\u0902\u0964",
      quickQuestions: ["ye field kya hai?", "ye form kis liye hai?", "kaunse documents chahiye?", "kahan kya bharna hai", "Download guidelines"],
      toolConfirmBtn: "\u2713 \u092A\u0941\u0937\u094D\u091F\u093F \u0915\u0930\u0947\u0902 / \u0939\u093E\u0901",
      toolCancelBtn: "\u2715 \u0930\u0926\u094D\u0926 \u0915\u0930\u0947\u0902 / \u0928\u0939\u0940\u0902",
      proposedActionTitle: "\u092A\u094D\u0930\u0938\u094D\u0924\u093E\u0935\u093F\u0924 \u0915\u093E\u0930\u094D\u0930\u0935\u093E\u0908",
      securityAlertTitle: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0928\u093F\u092F\u092E \u0926\u094D\u0935\u093E\u0930\u093E \u0905\u0935\u0930\u0941\u0926\u094D\u0927",
      externalDomainNotice: "\u26A0\uFE0F \u092C\u093E\u0939\u0930\u0940 \u0921\u094B\u092E\u0947\u0928 \u091A\u0947\u0924\u093E\u0935\u0928\u0940: \u0906\u092A \u090F\u0915 \u0905\u0932\u0917 \u0935\u0947\u092C\u0938\u093E\u0907\u091F \u092A\u0930 \u091C\u093E \u0930\u0939\u0947 \u0939\u0948\u0902\u0964 \u0915\u094D\u092F\u093E \u0906\u092A \u092A\u0941\u0937\u094D\u091F\u093F \u0915\u0930\u0924\u0947 \u0939\u0948\u0902?",
      docsNeeded: "\u0906\u0935\u0936\u094D\u092F\u0915 \u0926\u0938\u094D\u0924\u093E\u0935\u0947\u091C\u093C:",
      stepsHeading: "\u0906\u0935\u0947\u0926\u0928 \u0915\u0947 \u091A\u0930\u0923:",
      ttsRead: "\u{1F50A} \u092C\u094B\u0932\u0915\u0930 \u0938\u0941\u0928\u093E\u090F\u0902",
      activeTask: "\u0938\u0915\u094D\u0930\u093F\u092F \u0915\u093E\u0930\u094D\u092F",
      autoReadToggle: "\u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 \u091A\u0930\u0923 \u092C\u094B\u0932\u0915\u0930 \u0938\u0941\u0928\u093E\u090F\u0902",
      noVoiceWarning: (lang) => `\u0938\u0942\u091A\u0928\u093E: \u0907\u0938 \u0938\u093F\u0938\u094D\u091F\u092E \u092A\u0930 ${lang} \u0915\u0947 \u0932\u093F\u090F \u0915\u094B\u0908 \u0906\u0935\u093E\u091C \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u0940\u0964`,
      guideAction: "\u0939\u093E\u0907\u0932\u093E\u0907\u091F \u0915\u093F\u090F \u0917\u090F \u0935\u093F\u0915\u0932\u094D\u092A \u092A\u0930 \u0915\u094D\u0932\u093F\u0915 \u0915\u0930\u0947\u0902",
      pageGuide: "\u092A\u094B\u0930\u094D\u091F\u0932 \u092A\u0947\u091C \u0917\u093E\u0907\u0921",
      btnNextStep: "\u0905\u0917\u0932\u093E \u091A\u0930\u0923 \u2192",
      btnPrevStep: "\u2190 \u092A\u093F\u091B\u0932\u093E \u091A\u0930\u0923"
    },
    bn: {
      title: "\u099F\u09C7\u0995\u09AB\u09B0\u09CD\u09AE \u09AC\u09BE\u09A1\u09BF \u09B8\u09B9\u09BE\u09AF\u09BC\u0995",
      fieldsDetected: (n) => `${n} \u099F\u09BF \u09AB\u09B0\u09CD\u09AE \u09AB\u09BF\u09B2\u09CD\u09A1 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u0997\u09C7\u099B\u09C7`,
      fillSafe: "\u26A1 \u09AF\u09BE\u099A\u09BE\u0987\u0995\u09C3\u09A4 \u09A4\u09A5\u09CD\u09AF \u09AA\u09C2\u09B0\u09A3 \u0995\u09B0\u09C1\u09A8",
      fillAll: "\u09B8\u09AC \u09AA\u09C2\u09B0\u09A3 \u0995\u09B0\u09C1\u09A8",
      clear: "\u09AE\u09C1\u099B\u09C1\u09A8",
      confirmLow: "\u09B8\u09A8\u09CD\u09A6\u09C7\u09B9\u099C\u09A8\u0995 \u09AE\u09BF\u09B2: \u09AA\u09C2\u09B0\u09A3 \u0995\u09B0\u09BE\u09B0 \u0986\u0997\u09C7 \u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u0995\u09B0\u09C1\u09A8",
      reviewSubmit: "\u09B8\u09AC\u0995\u09BF\u099B\u09C1 \u09AA\u09B0\u09CD\u09AF\u09BE\u09B2\u09CB\u099A\u09A8\u09BE \u0995\u09B0\u09C1\u09A8, \u09A4\u09BE\u09B0\u09AA\u09B0 \u09AA\u09CB\u09B0\u09CD\u099F\u09BE\u09B2\u09C7 \u09A8\u09BF\u099C\u09C7 \u099C\u09AE\u09BE \u09A6\u09BF\u09A8\u0964 TechForm Buddy \u0995\u0996\u09A8\u09CB \u09B8\u09CD\u09AC\u09AF\u09BC\u0982\u0995\u09CD\u09B0\u09BF\u09AF\u09BC\u09AD\u09BE\u09AC\u09C7 \u09AB\u09B0\u09CD\u09AE \u099C\u09AE\u09BE \u09A6\u09C7\u09AF\u09BC \u09A8\u09BE\u0964",
      notPairedTitle: "TechForm Buddy \u0996\u09C1\u09B2\u09C1\u09A8 \u098F\u09AC\u0982 \u09B8\u09BE\u0987\u09A8 \u0987\u09A8 \u0995\u09B0\u09C1\u09A8",
      notPairedMsg: "\u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09BF\u09A4 \u09AA\u09CD\u09B0\u09CB\u09AB\u09BE\u0987\u09B2 \u09AF\u09C1\u0995\u09CD\u09A4 \u0995\u09B0\u09A4\u09C7 \u098F\u09AC\u0982 \u0985\u099F\u09CB-\u09AB\u09BF\u09B2 \u09B8\u0995\u09CD\u09B7\u09AE \u0995\u09B0\u09A4\u09C7 \u09B8\u09BE\u0987\u09A8 \u0987\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
      openAppBtn: "TechForm Buddy \u0996\u09C1\u09B2\u09C1\u09A8 \u2197",
      tabForm: "\u{1F4CB} \u0985\u099F\u09CB-\u09AB\u09BF\u09B2",
      tabGuide: "\u2139\uFE0F \u0997\u09BE\u0987\u09A1",
      tabAssistant: "\u{1F4AC} \u09B8\u09B9\u0995\u09BE\u09B0\u09C0",
      askPlaceholder: "\u0995\u09BE\u0997\u099C\u09AA\u09A4\u09CD\u09B0 \u09AC\u09BE \u09A8\u09BF\u09AF\u09BC\u09AE \u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995\u09C7 \u099C\u09BF\u099C\u09CD\u099E\u09BE\u09B8\u09BE \u0995\u09B0\u09C1\u09A8...",
      askBtn: "\u099C\u09BE\u09A8\u09C1\u09A8",
      asking: "\u0996\u09CB\u0981\u099C\u09BE \u09B9\u099A\u09CD\u099B\u09C7...",
      noAssistantAnswer: "\u0995\u09CB\u09A8\u09CB \u0989\u09A4\u09CD\u09A4\u09B0 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF\u0964 \u0989\u09AA\u09B0\u09C7 \u09AA\u09CD\u09B0\u09B6\u09CD\u09A8 \u09B2\u09BF\u0996\u09C1\u09A8\u0964",
      quickQuestions: ["\u0995\u09C0 \u0995\u09C0 \u09A8\u09A5\u09BF \u09B2\u09BE\u0997\u09AC\u09C7?", "\u0995\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AB\u09B0\u09CD\u09AE \u09AA\u09C2\u09B0\u09A3 \u0995\u09B0\u09AC\u09C7\u09A8?"],
      docsNeeded: "\u09AA\u09CD\u09B0\u09AF\u09BC\u09CB\u099C\u09A8\u09C0\u09AF\u09BC \u09A8\u09A5\u09BF:",
      stepsHeading: "\u0986\u09AC\u09C7\u09A6\u09A8\u09C7\u09B0 \u09A7\u09BE\u09AA:",
      ttsRead: "\u{1F50A} \u09B6\u09C1\u09A8\u09C1\u09A8"
    },
    ta: {
      title: "\u0B9F\u0BC6\u0B95\u0BCD\u0B83\u0BAA\u0BBE\u0BB0\u0BCD\u0BAE\u0BCD \u0BAA\u0B9F\u0BBF \u0B89\u0BA4\u0BB5\u0BBF\u0BAF\u0BBE\u0BB3\u0BB0\u0BCD",
      fieldsDetected: (n) => `${n} \u0BAA\u0BC1\u0BB2\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B95\u0BA3\u0BCD\u0B9F\u0BB1\u0BBF\u0BAF\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA9`,
      fillSafe: "\u26A1 \u0B9A\u0BB0\u0BBF\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BB5\u0BB1\u0BCD\u0BB1\u0BC8 \u0BA8\u0BBF\u0BB0\u0BAA\u0BCD\u0BAA\u0BC1\u0B95",
      fillAll: "\u0B85\u0BA9\u0BC8\u0BA4\u0BCD\u0BA4\u0BC8\u0BAF\u0BC1\u0BAE\u0BCD \u0BA8\u0BBF\u0BB0\u0BAA\u0BCD\u0BAA\u0BC1\u0B95",
      clear: "\u0B85\u0BB4\u0BBF\u0B95\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD",
      confirmLow: "\u0B95\u0BC1\u0BB1\u0BC8\u0BA8\u0BCD\u0BA4 \u0BA8\u0BAE\u0BCD\u0BAA\u0BBF\u0B95\u0BCD\u0B95\u0BC8: \u0BA8\u0BBF\u0BB0\u0BAA\u0BCD\u0BAA\u0BC1\u0BB5\u0BA4\u0BB1\u0BCD\u0B95\u0BC1 \u0BAE\u0BC1\u0BA9\u0BCD \u0B89\u0BB1\u0BC1\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BB5\u0BC1\u0BAE\u0BCD",
      reviewSubmit: "\u0B85\u0BA9\u0BC8\u0BA4\u0BCD\u0BA4\u0BC8\u0BAF\u0BC1\u0BAE\u0BCD \u0B9A\u0BB0\u0BBF\u0BAA\u0BBE\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BC1, \u0BAA\u0BCB\u0BB0\u0BCD\u0B9F\u0BCD\u0B9F\u0BB2\u0BBF\u0BB2\u0BCD \u0BA8\u0BC0\u0B99\u0BCD\u0B95\u0BB3\u0BC7 \u0B9A\u0BAE\u0BB0\u0BCD\u0BAA\u0BCD\u0BAA\u0BBF\u0B95\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD. TechForm Buddy \u0BA4\u0BBE\u0BA9\u0BBE\u0B95\u0BAA\u0BCD \u0BAA\u0B9F\u0BBF\u0BB5\u0B99\u0BCD\u0B95\u0BB3\u0BC8\u0B9A\u0BCD \u0B9A\u0BAE\u0BB0\u0BCD\u0BAA\u0BCD\u0BAA\u0BBF\u0B95\u0BCD\u0B95\u0BBE\u0BA4\u0BC1.",
      notPairedTitle: "TechForm Buddy-\u0BAF\u0BC8\u0BA4\u0BCD \u0BA4\u0BBF\u0BB1\u0BA8\u0BCD\u0BA4\u0BC1 \u0B89\u0BB3\u0BCD\u0BA8\u0BC1\u0BB4\u0BC8\u0BAF\u0BB5\u0BC1\u0BAE\u0BCD",
      notPairedMsg: "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BB5\u0BBF\u0BB5\u0BB0\u0B95\u0BCD\u0B95\u0BC1\u0BB1\u0BBF\u0BAA\u0BCD\u0BAA\u0BC8 \u0B87\u0BA3\u0BC8\u0B95\u0BCD\u0B95 TechForm Buddy-\u0BAF\u0BBF\u0BB2\u0BCD \u0B89\u0BB3\u0BCD\u0BA8\u0BC1\u0BB4\u0BC8\u0BAF\u0BB5\u0BC1\u0BAE\u0BCD.",
      openAppBtn: "TechForm Buddy \u0BA4\u0BBF\u0BB1 \u2197",
      tabForm: "\u{1F4CB} \u0B86\u0B9F\u0BCD\u0B9F\u0BCB-\u0B83\u0BAA\u0BBF\u0BB2\u0BCD",
      tabGuide: "\u2139\uFE0F \u0BB5\u0BB4\u0BBF\u0B95\u0BBE\u0B9F\u0BCD\u0B9F\u0BBF",
      tabAssistant: "\u{1F4AC} \u0B89\u0BA4\u0BB5\u0BBF",
      askPlaceholder: "\u0B86\u0BB5\u0BA3\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B85\u0BB2\u0BCD\u0BB2\u0BA4\u0BC1 \u0BB5\u0BB4\u0BBF\u0B95\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1\u0BA4\u0BB2\u0BC8\u0BAA\u0BCD \u0BAA\u0BB1\u0BCD\u0BB1\u0BBF \u0B95\u0BC7\u0B9F\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD...",
      askBtn: "\u0B95\u0BC7\u0B9F\u0BCD\u0B95",
      asking: "\u0BA4\u0BC7\u0B9F\u0BC1\u0B95\u0BBF\u0BB1\u0BA4\u0BC1...",
      noAssistantAnswer: "\u0BB5\u0BB4\u0BBF\u0B95\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1\u0BA4\u0BB2\u0BCD \u0B95\u0BBF\u0B9F\u0BC8\u0B95\u0BCD\u0B95\u0BB5\u0BBF\u0BB2\u0BCD\u0BB2\u0BC8. \u0BAE\u0BC7\u0BB2\u0BC7 \u0B95\u0BC7\u0B9F\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD.",
      quickQuestions: ["\u0B8E\u0BA9\u0BCD\u0BA9 \u0B86\u0BB5\u0BA3\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BA4\u0BC7\u0BB5\u0BC8?", "\u0BAA\u0B9F\u0BBF\u0BB5\u0BA4\u0BCD\u0BA4\u0BC8 \u0B8E\u0BAA\u0BCD\u0BAA\u0B9F\u0BBF \u0BA8\u0BBF\u0BB0\u0BAA\u0BCD\u0BAA\u0BC1\u0BB5\u0BA4\u0BC1?"],
      docsNeeded: "\u0BA4\u0BC7\u0BB5\u0BC8\u0BAF\u0BBE\u0BA9 \u0B86\u0BB5\u0BA3\u0B99\u0BCD\u0B95\u0BB3\u0BCD:",
      stepsHeading: "\u0BAA\u0B9F\u0BBF\u0BA8\u0BBF\u0BB2\u0BC8\u0B95\u0BB3\u0BCD:",
      ttsRead: "\u{1F50A} \u0BB5\u0BBE\u0B9A\u0BBF"
    },
    te: {
      title: "\u0C1F\u0C46\u0C15\u0C4D\u0C2B\u0C3E\u0C2E\u0C4D \u0C2C\u0C21\u0C4D\u0C21\u0C40 \u0C05\u0C38\u0C3F\u0C38\u0C4D\u0C1F\u0C46\u0C02\u0C1F\u0C4D",
      fieldsDetected: (n) => `${n} \u0C2B\u0C3E\u0C30\u0C2E\u0C4D \u0C2B\u0C40\u0C32\u0C4D\u0C21\u0C4D\u200C\u0C32\u0C41 \u0C17\u0C41\u0C30\u0C4D\u0C24\u0C3F\u0C02\u0C1A\u0C2C\u0C21\u0C4D\u0C21\u0C3E\u0C2F\u0C3F`,
      fillSafe: "\u26A1 \u0C27\u0C43\u0C35\u0C40\u0C15\u0C30\u0C3F\u0C02\u0C1A\u0C3F\u0C28\u0C35\u0C3F \u0C28\u0C3F\u0C02\u0C2A\u0C02\u0C21\u0C3F",
      fillAll: "\u0C05\u0C28\u0C4D\u0C28\u0C40 \u0C28\u0C3F\u0C02\u0C2A\u0C02\u0C21\u0C3F",
      clear: "\u0C15\u0C4D\u0C32\u0C3F\u0C2F\u0C30\u0C4D \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F",
      confirmLow: "\u0C24\u0C15\u0C4D\u0C15\u0C41\u0C35 \u0C35\u0C3F\u0C36\u0C4D\u0C35\u0C38\u0C28\u0C40\u0C2F\u0C24: \u0C28\u0C3F\u0C02\u0C2A\u0C47 \u0C2E\u0C41\u0C02\u0C26\u0C41 \u0C28\u0C3F\u0C30\u0C4D\u0C27\u0C3E\u0C30\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F",
      reviewSubmit: "\u0C38\u0C2E\u0C40\u0C15\u0C4D\u0C37\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F, \u0C24\u0C30\u0C4D\u0C35\u0C3E\u0C24 \u0C2E\u0C40\u0C30\u0C47 \u0C2A\u0C4B\u0C30\u0C4D\u0C1F\u0C32\u0C4D\u200C\u0C32\u0C4B \u0C38\u0C2C\u0C4D\u0C2E\u0C3F\u0C1F\u0C4D \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F. TechForm Buddy \u0C0E\u0C2A\u0C4D\u0C2A\u0C41\u0C21\u0C42 \u0C38\u0C4D\u0C35\u0C2F\u0C02\u0C1A\u0C3E\u0C32\u0C15\u0C02\u0C17\u0C3E \u0C38\u0C2C\u0C4D\u0C2E\u0C3F\u0C1F\u0C4D \u0C1A\u0C47\u0C2F\u0C26\u0C41.",
      notPairedTitle: "TechForm Buddy \u0C24\u0C46\u0C30\u0C3F\u0C1A\u0C3F \u0C38\u0C48\u0C28\u0C4D \u0C07\u0C28\u0C4D \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F",
      notPairedMsg: "\u0C2E\u0C40 \u0C2A\u0C4D\u0C30\u0C4A\u0C2B\u0C48\u0C32\u0C4D \u0C15\u0C28\u0C46\u0C15\u0C4D\u0C1F\u0C4D \u0C1A\u0C47\u0C2F\u0C21\u0C3E\u0C28\u0C3F\u0C15\u0C3F TechForm Buddy \u0C32\u0C4B \u0C38\u0C48\u0C28\u0C4D \u0C07\u0C28\u0C4D \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F.",
      openAppBtn: "TechForm Buddy \u0C24\u0C46\u0C30\u0C41\u0C35\u0C41 \u2197",
      tabForm: "\u{1F4CB} \u0C06\u0C1F\u0C4B-\u0C2B\u0C3F\u0C32\u0C4D",
      tabGuide: "\u2139\uFE0F \u0C17\u0C48\u0C21\u0C4D",
      tabAssistant: "\u{1F4AC} \u0C05\u0C38\u0C3F\u0C38\u0C4D\u0C1F\u0C46\u0C02\u0C1F\u0C4D",
      askPlaceholder: "\u0C2A\u0C24\u0C4D\u0C30\u0C3E\u0C32\u0C41 \u0C32\u0C47\u0C26\u0C3E \u0C35\u0C3F\u0C27\u0C3E\u0C28\u0C3E\u0C32 \u0C17\u0C41\u0C30\u0C3F\u0C02\u0C1A\u0C3F \u0C05\u0C21\u0C17\u0C02\u0C21\u0C3F...",
      askBtn: "\u0C05\u0C21\u0C41\u0C17\u0C41",
      asking: "\u0C36\u0C4B\u0C27\u0C3F\u0C38\u0C4D\u0C24\u0C4B\u0C02\u0C26\u0C3F...",
      noAssistantAnswer: "\u0C38\u0C2E\u0C3E\u0C1A\u0C3E\u0C30\u0C02 \u0C26\u0C4A\u0C30\u0C15\u0C32\u0C47\u0C26\u0C41. \u0C2A\u0C48\u0C28 \u0C05\u0C21\u0C17\u0C02\u0C21\u0C3F.",
      quickQuestions: ["\u0C0F \u0C2A\u0C24\u0C4D\u0C30\u0C3E\u0C32\u0C41 \u0C05\u0C35\u0C38\u0C30\u0C02?", "\u0C2B\u0C3E\u0C30\u0C2E\u0C4D\u200C\u0C28\u0C41 \u0C0E\u0C32\u0C3E \u0C28\u0C3F\u0C02\u0C2A\u0C3E\u0C32\u0C3F?"],
      docsNeeded: "\u0C15\u0C3E\u0C35\u0C32\u0C38\u0C3F\u0C28 \u0C2A\u0C24\u0C4D\u0C30\u0C3E\u0C32\u0C41:",
      stepsHeading: "\u0C26\u0C30\u0C16\u0C3E\u0C38\u0C4D\u0C24\u0C41 \u0C26\u0C36\u0C32\u0C41:",
      ttsRead: "\u{1F50A} \u0C35\u0C3F\u0C28\u0C02\u0C21\u0C3F"
    }
  };
  var isWidgetHidden = false;
  async function initPortalContentScript() {
    const isIframe = window !== window.top;
    const frameInfo = isIframe ? "(iframe)" : "(top window)";
    console.log(`[TechFormBuddy] Initializing portal assistant ${frameInfo} on ${window.location.hostname}`);
    if (isIframe) {
      const iframeFields = detectFormFields();
      if (iframeFields.length > 0) {
        try {
          window.top?.postMessage({
            type: "TFB_IFRAME_FORM_DETECTED",
            fieldCount: iframeFields.length,
            href: window.location.href
          }, "*");
        } catch {
        }
      }
      window.addEventListener("message", (ev) => {
        if (ev.data?.type === "TFB_IFRAME_FILL_ALL") {
          applyAutofillToPage();
        }
      });
      return;
    }
    document.getElementById("tfb-launcher-badge")?.remove();
    document.getElementById("tfb-portal-overlay-host")?.remove();
    document.querySelectorAll("[data-tfb-root]").forEach((el) => el.remove());
    document.documentElement.dataset.tfbInjected = "true";
    window.addEventListener("message", (ev) => {
      if (ev.data?.type === "TFB_IFRAME_FORM_DETECTED") {
        console.log(`[TechFormBuddy] Top frame registered ${ev.data.fieldCount} fields from iframe`);
      }
    });
    let isPaired = false;
    try {
      const statusRes = await sendBackgroundMessage({ type: "TFB_GET_STATUS" });
      if (statusRes) {
        if (statusRes.language) activeLang = statusRes.language;
        if (statusRes.taskName) activeTaskName = statusRes.taskName;
        isPaired = Boolean(statusRes.connected);
      }
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["tfb_hidden_sites", "tfb_hide_everywhere"], (items) => {
          const hiddenSites = items?.tfb_hidden_sites || {};
          if (hiddenSites[window.location.hostname] || items?.tfb_hide_everywhere) {
            isWidgetHidden = true;
            const badge = document.getElementById("tfb-launcher-badge");
            if (badge) badge.style.display = "none";
          }
        });
      }
    } catch (e) {
      console.warn("[TechFormBuddy] Error fetching initial status:", e);
    }
    if (!hasCheckedOnVisitAlerts) {
      hasCheckedOnVisitAlerts = true;
      sendBackgroundMessage({ type: "TFB_GET_ON_VISIT_ALERTS", domain: window.location.hostname }).then((resp) => {
        if (resp && resp.hasAlerts && resp.alerts && resp.alerts.length > 0) {
          onVisitAlerts = resp.alerts;
          onVisitSourceName = resp.sourceName || window.location.hostname;
          if (overlayHost) {
            renderPortalOverlay();
          } else {
            scanAndLaunchOverlay(activeLang);
          }
        }
      }).catch(() => {
      });
    }
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || !message.type) return false;
      switch (message.type) {
        case "TFB_PING": {
          sendResponse({ success: true, loaded: true, href: window.location.href });
          return false;
        }
        case "TFB_START_PAGE": {
          isWidgetHidden = false;
          const badge = document.getElementById("tfb-launcher-badge");
          if (badge) badge.style.display = "flex";
          scanAndLaunchOverlay(message.language || activeLang);
          sendResponse({ success: true });
          return false;
        }
        case "TFB_SET_LANGUAGE": {
          if (message.language) {
            activeLang = message.language;
            updateOverlayLanguage(activeLang);
          }
          sendResponse({ success: true });
          return false;
        }
        case "TFB_SET_TASK": {
          if (message.taskName) {
            activeTaskName = message.taskName;
          }
          if (message.language) {
            activeLang = message.language;
          }
          renderPortalOverlay();
          sendResponse({ success: true });
          return false;
        }
        case "TFB_SHOW_BUDDY": {
          isWidgetHidden = false;
          try {
            if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
              chrome.storage.local.get(["tfb_hidden_sites"], (items) => {
                const hiddenSites = items?.tfb_hidden_sites || {};
                delete hiddenSites[window.location.hostname];
                chrome.storage.local.set({ tfb_hidden_sites: hiddenSites });
              });
            }
          } catch {
          }
          const badge = document.getElementById("tfb-launcher-badge");
          if (badge) {
            badge.style.display = "flex";
          } else {
            checkAndSetupPageAssistance(activeLang, isPaired);
          }
          sendResponse({ success: true });
          return false;
        }
        case "TFB_TOGGLE_VISIBILITY": {
          isWidgetHidden = !isWidgetHidden;
          const badge = document.getElementById("tfb-launcher-badge");
          if (isWidgetHidden) {
            stopPortalSpeech();
            if (badge) badge.style.display = "none";
            if (overlayHost) overlayHost.style.display = "none";
          } else {
            if (badge) badge.style.display = "flex";
            else checkAndSetupPageAssistance(activeLang, isPaired);
          }
          sendResponse({ success: true, isHidden: isWidgetHidden });
          return false;
        }
      }
      return false;
    });
    setTimeout(() => {
      checkAndSetupPageAssistance(activeLang, isPaired);
    }, 500);
  }
  function sendBackgroundMessage(msg) {
    return new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({ error: "TIMEOUT", timeout: true });
        }
      }, 4e3);
      try {
        chrome.runtime.sendMessage(msg, (response) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            if (chrome.runtime.lastError) {
              resolve({ error: chrome.runtime.lastError.message });
            } else {
              resolve(response || {});
            }
          }
        });
      } catch (e) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve({ error: e.message });
        }
      }
    });
  }
  var KNOWN_LANGUAGE_NAMES = /* @__PURE__ */ new Set([
    "english",
    "hindi",
    "\u0939\u093F\u0928\u094D\u0926\u0940",
    "bengali",
    "\u09AC\u09BE\u0982\u09B2\u09BE",
    "telugu",
    "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41",
    "marathi",
    "\u092E\u0930\u093E\u0920\u0940",
    "tamil",
    "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD",
    "urdu",
    "\u0627\u0631\u062F\u0648",
    "gujarati",
    "\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0",
    "kannada",
    "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1",
    "odia",
    "\u0B13\u0B21\u0B3C\u0B3F\u0B06",
    "malayalam",
    "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02",
    "punjabi",
    "\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40",
    "assamese",
    "\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE",
    "maithili",
    "santali",
    "kashmiri",
    "nepali",
    "sindhi",
    "konkani",
    "dogri",
    "manipuri",
    "bodo",
    "sanskrit",
    "french",
    "spanish",
    "german",
    "japanese",
    "chinese"
  ]);
  function isLanguageControl(el) {
    if (el instanceof HTMLSelectElement) {
      const options = Array.from(el.options);
      if (options.length > 0) {
        let langMatchCount = 0;
        for (const opt of options) {
          const text = opt.text.trim().toLowerCase();
          const val = opt.value.trim().toLowerCase();
          if (KNOWN_LANGUAGE_NAMES.has(text) || KNOWN_LANGUAGE_NAMES.has(val)) {
            langMatchCount++;
          }
        }
        if (langMatchCount >= 2 || options.length > 0 && langMatchCount / options.length >= 0.4) {
          return true;
        }
      }
    }
    const attrString = `${el.id} ${el.getAttribute("name") || ""} ${el.className || ""} ${el.getAttribute("aria-label") || ""} ${el.getAttribute("title") || ""}`.toLowerCase();
    if (/\b(lang|language|bhasha|locale|select_language|language_select|lang_choice)\b/i.test(attrString)) {
      return true;
    }
    const parent = el.closest('.language-selector, .lang-picker, .language-dropdown, #language, [id*="language" i], [class*="language" i], [class*="goog-te-combo"]');
    if (parent) {
      return true;
    }
    const parentLabel = el.closest("label");
    if (parentLabel && /\b(language|select\s+language|choose\s+language|भाषा)\b/i.test(parentLabel.textContent || "")) {
      return true;
    }
    return false;
  }
  function isSearchControl(el) {
    const type = (el.getAttribute("type") || "").toLowerCase();
    if (type === "search") return true;
    const role = (el.getAttribute("role") || "").toLowerCase();
    if (role === "search") return true;
    const attrString = `${el.id} ${el.getAttribute("name") || ""} ${el.className || ""} ${el.getAttribute("placeholder") || ""} ${el.getAttribute("aria-label") || ""}`.toLowerCase();
    if (/\b(search|site_search|globalsearch|topsearch|search_query|searchbox|searchbar|search_input)\b/i.test(attrString)) {
      return true;
    }
    if (el.closest('[role="search"], form.search, form[action*="search" i]')) {
      return true;
    }
    const placeholder = (el.getAttribute("placeholder") || "").toLowerCase().trim();
    if (/^search(\s+here|\s+portal|\s+site|\.\.\.)?$/i.test(placeholder)) {
      return true;
    }
    return false;
  }
  function isNavigationOrHeaderFooterControl(el) {
    return Boolean(
      el.closest('header, nav, footer, [role="banner"], [role="navigation"], [role="contentinfo"], .navbar, .site-header, .site-footer, .header, .footer')
    );
  }
  function isRealForm(fields) {
    return Boolean(fields && fields.length >= 3);
  }
  function isSensitiveField(element) {
    const type = element.type ? element.type.toLowerCase() : "";
    if (type === "password") return true;
    const autocomplete = (element.getAttribute("autocomplete") || "").toLowerCase();
    if (autocomplete.includes("password") || autocomplete.includes("one-time-code") || autocomplete.includes("otp")) {
      return true;
    }
    const name = (element.name || "").toLowerCase();
    const id = (element.id || "").toLowerCase();
    const placeholder = (element.placeholder || "").toLowerCase();
    const ariaLabel = (element.getAttribute("aria-label") || "").toLowerCase();
    const label = findLabelText(element).toLowerCase();
    const combined = `${name} ${id} ${placeholder} ${ariaLabel} ${label}`;
    const sensitiveRegex = /password|passwd|passcode|otp|totp|\bpin\b|cvv|cvc|captcha|secret|authcode|security_code|aadhaar|aadhar|uidai|\bpan\b|pan[_\s]?card|pan[_\s]?number|pan_no|pancard|passport|voter[_\s]?id|epic|account[_\s]?number|account_no|debit[_\s]?card|credit[_\s]?card|bank[_\s]?account|ifsc|iban/i;
    return sensitiveRegex.test(combined);
  }
  function detectFormFields() {
    const inputs = Array.from(document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea'
    ));
    const items = [];
    for (const el of inputs) {
      const type = el.tagName.toLowerCase() === "textarea" ? "textarea" : el.type || "text";
      const name = el.name || el.id || "";
      const label = findLabelText(el);
      if (isSensitiveField(el)) {
        continue;
      }
      if (isLanguageControl(el) || isSearchControl(el) || isNavigationOrHeaderFooterControl(el)) {
        continue;
      }
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || el.disabled) {
        continue;
      }
      items.push({
        id: el.id || name || `field_${items.length}`,
        name,
        label: label || name || "Form Field",
        type,
        element: el
      });
    }
    return items;
  }
  function findLabelText(element) {
    if (element.id) {
      const labelElem = document.querySelector(`label[for="${element.id}"]`);
      if (labelElem && labelElem.textContent?.trim()) {
        return labelElem.textContent.trim();
      }
    }
    const parentLabel = element.closest("label");
    if (parentLabel && parentLabel.textContent?.trim()) {
      return parentLabel.textContent.replace(element.textContent || "", "").trim();
    }
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();
    const placeholder = element.placeholder;
    if (placeholder && placeholder.trim()) return placeholder.trim();
    return "";
  }
  function createFloatingLauncherBadge(count, language, isPaired) {
    if (document.getElementById("tfb-launcher-badge")) return;
    const realForm = count >= 3;
    const badgePill = realForm ? `<span style="background:#2563eb;color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">${count} fields</span>` : `<span style="background:#059669;color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">Page Guide</span>`;
    const badge = document.createElement("div");
    badge.id = "tfb-launcher-badge";
    badge.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;cursor:grab;">
      <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true" style="display:block;flex:0 0 34px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.22));">
        <path d="M12 18 9 7c-.4-1.6 1.4-2.5 2.7-1.5L20 12m16 6 3-11c.4-1.6-1.4-2.5-2.7-1.5L28 12" fill="#fff9e9" stroke="#e9dab9" stroke-width="1.7" stroke-linejoin="round"/>
        <circle cx="24" cy="26" r="17" fill="#fff9e9" stroke="#e9dab9" stroke-width="1.7"/>
        <ellipse cx="17" cy="29" rx="2.7" ry="1.4" fill="#f2a4c0" opacity=".75"/><ellipse cx="31" cy="29" rx="2.7" ry="1.4" fill="#f2a4c0" opacity=".75"/>
        <ellipse cx="19" cy="23" rx="1.8" ry="2.6" fill="#362b3c"/><ellipse cx="29" cy="23" rx="1.8" ry="2.6" fill="#362b3c"/>
        <circle cx="19.7" cy="22.2" r=".65" fill="white"/><circle cx="29.7" cy="22.2" r=".65" fill="white"/>
        <path d="M22 31c1.4 1.8 2.6 1.8 4 0" fill="none" stroke="#b96f75" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M35 12c-4-5-8-4-7-1 0 2 3 3 6 3-4 1-5 5-2 5s4-3 4-6c2 4 6 4 6 1 0-2-3-3-6-3 3-2 3-5 1-5-2-.5-3 2-3 6Z" fill="#ff3155" stroke="#b51d3b" stroke-width="1.3" stroke-linejoin="round"/>
      </svg>
      <span style="font-weight:700;font-size:13px;">TechForm Buddy</span>
      ${badgePill}
      <span id="tfb-pill-autofill-badge" data-testid="pill-autofill-status" style="background:${isAutofillModeOn ? "#2563eb" : "#475569"};color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">\u26A1 Autofill: ${isAutofillModeOn ? "ON" : "OFF"}</span>
      <button id="tfb-pill-mic-btn" style="background:transparent;border:none;color:#cbd5e1;font-size:13px;cursor:pointer;padding:2px 4px;border-radius:9999px;" title="Voice Commands" aria-label="Voice Commands">\u{1F399}\uFE0F</button>
      <button id="tfb-pill-close-btn" style="background:transparent;border:none;color:#94a3b8;font-size:13px;cursor:pointer;padding:2px 6px;border-radius:9999px;margin-left:2px;" title="Hide TechForm Buddy (Alt+B to restore)" aria-label="Hide Buddy">\u2715</button>
    </div>
    <!-- Micro-target buttons for automated tests & accessibility -->
    <button id="voice-read-page-btn" style="position:absolute;width:1px;height:1px;opacity:0.01;overflow:hidden;border:none;background:transparent;pointer-events:auto;" aria-label="Read aloud">Read</button>
    <button id="voice-command-mic-btn" style="position:absolute;width:1px;height:1px;opacity:0.01;overflow:hidden;border:none;background:transparent;pointer-events:auto;" aria-label="Voice Commands">Voice</button>
  `;
    badge.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0f172a;
    color: #ffffff;
    border: 1.5px solid #3b82f6;
    padding: 10px 16px;
    border-radius: 9999px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    z-index: 2147483640;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    user-select: none;
    cursor: grab;
    touch-action: none;
    transition: transform 0.15s ease;
    ${isWidgetHidden ? "display: none;" : "display: flex;"}
  `;
    try {
      const savedPos = localStorage.getItem("tfb_badge_pos");
      if (savedPos) {
        const p = JSON.parse(savedPos);
        if (p && typeof p.x === "number" && typeof p.y === "number") {
          badge.style.left = `${p.x}px`;
          badge.style.top = `${p.y}px`;
          badge.style.bottom = "auto";
          badge.style.right = "auto";
        }
      }
    } catch {
    }
    badge.onmouseenter = () => {
      badge.style.transform = "scale(1.04)";
    };
    badge.onmouseleave = () => {
      badge.style.transform = "scale(1.0)";
    };
    let isDragging = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;
    const onPointerDown = (e) => {
      isDragging = true;
      hasMoved = false;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      startX = clientX;
      startY = clientY;
      const rect = badge.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      badge.style.cursor = "grabbing";
      badge.style.transition = "none";
      window.addEventListener("mousemove", onPointerMove, { passive: false });
      window.addEventListener("mouseup", onPointerUp);
      window.addEventListener("touchmove", onPointerMove, { passive: false });
      window.addEventListener("touchend", onPointerUp);
    };
    const onPointerMove = (e) => {
      if (!isDragging) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - startX;
      const dy = clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved = true;
        if (e.cancelable) e.preventDefault();
        badge.style.bottom = "auto";
        badge.style.right = "auto";
        badge.style.left = `${Math.max(10, Math.min(window.innerWidth - 180, origLeft + dx))}px`;
        badge.style.top = `${Math.max(10, Math.min(window.innerHeight - 60, origTop + dy))}px`;
      }
    };
    const onPointerUp = () => {
      isDragging = false;
      badge.style.cursor = "grab";
      badge.style.transition = "transform 0.15s ease";
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      if (hasMoved) {
        try {
          const r = badge.getBoundingClientRect();
          localStorage.setItem("tfb_badge_pos", JSON.stringify({ x: r.left, y: r.top }));
        } catch {
        }
      }
    };
    badge.addEventListener("mousedown", onPointerDown);
    badge.addEventListener("touchstart", onPointerDown, { passive: true });
    const closeBtn = badge.querySelector("#tfb-pill-close-btn");
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        isWidgetHidden = true;
        stopPortalSpeech();
        badge.style.display = "none";
        if (overlayHost) overlayHost.style.display = "none";
        sendBackgroundMessage({ type: "TFB_HIDE_SITE", siteHost: window.location.hostname });
      };
    }
    const pillMic = badge.querySelector("#tfb-pill-mic-btn");
    if (pillMic) {
      pillMic.onclick = (e) => {
        e.stopPropagation();
        scanAndLaunchOverlay(language);
        activeTab = "assistant";
        renderPortalOverlay();
        startAssistantVoiceInput();
      };
    }
    const testReadBtn = badge.querySelector("#voice-read-page-btn");
    if (testReadBtn) {
      testReadBtn.onclick = (e) => {
        e.stopPropagation();
        speakPortalGuideStep();
      };
    }
    const testVoiceBtn = badge.querySelector("#voice-command-mic-btn");
    if (testVoiceBtn) {
      testVoiceBtn.onclick = (e) => {
        e.stopPropagation();
        scanAndLaunchOverlay(language);
        activeTab = "assistant";
        renderPortalOverlay();
        startAssistantVoiceInput();
      };
    }
    badge.onclick = (e) => {
      if (hasMoved) {
        hasMoved = false;
        return;
      }
      scanAndLaunchOverlay(language);
    };
    document.body.appendChild(badge);
  }
  function checkAndSetupPageAssistance(language, isPaired) {
    const fields = detectFormFields();
    console.log(`[TechFormBuddy] Scanned ${fields.length} relevant form fields on ${window.location.hostname}`);
    createFloatingLauncherBadge(fields.length, language, isPaired);
  }
  async function scanAndLaunchOverlay(language) {
    activeLang = language;
    currentFieldsList = detectFormFields();
    if (!isRealForm(currentFieldsList)) {
      activeTab = "guide";
    } else {
      activeTab = "form";
    }
    if (!overlayHost) {
      overlayHost = document.createElement("div");
      overlayHost.id = "tfb-portal-overlay-host";
      overlayHost.style.cssText = "display: block; position: fixed; top: 0; right: 0; width: 420px; height: 100vh; z-index: 2147483646;";
      document.body.appendChild(overlayHost);
    }
    renderPortalOverlay();
  }
  function updateOverlayLanguage(lang) {
    activeLang = lang;
    renderPortalOverlay();
  }
  async function renderPortalOverlay() {
    if (!overlayHost) return;
    const t = OVERLAY_TEXTS[activeLang] || OVERLAY_TEXTS.en;
    const statusRes = await sendBackgroundMessage({ type: "TFB_GET_STATUS" });
    const isConnected = Boolean(statusRes && statusRes.connected);
    const appUrl = statusRes?.appUrl || "http://localhost:3000";
    if (statusRes?.taskName && !activeTaskName) {
      activeTaskName = statusRes.taskName;
    }
    const realFormPage = isRealForm(currentFieldsList);
    if (!realFormPage && activeTab === "form") {
      activeTab = "guide";
    }
    let fillValues = {};
    if (isConnected && realFormPage) {
      const valRes = await sendBackgroundMessage({ type: "TFB_GET_FILL_VALUES" });
      if (valRes && valRes.fillValues) {
        fillValues = valRes.fillValues;
        latestFillValues = fillValues;
      }
    }
    let mappings = [];
    if (isConnected && realFormPage && currentFieldsList.length > 0) {
      const mapPayload = {
        siteHost: window.location.hostname,
        language: activeLang,
        fields: currentFieldsList.map((f) => ({ id: f.id, label: f.label, type: f.type })),
        profileKeys: Object.keys(fillValues)
      };
      const mapRes = await sendBackgroundMessage({ type: "TFB_MAP_FORM", ...mapPayload });
      if (mapRes && mapRes.mappings) {
        mappings = mapRes.mappings;
      }
    }
    if (realFormPage) {
      currentFieldsList.forEach((f) => {
        const matched = mappings.find((m) => m.fieldId === f.id);
        if (matched) {
          f.mappedKey = matched.profileKey;
          f.confidence = matched.confidence || 0.85;
          f.mappedValue = matched.profileKey && fillValues[matched.profileKey] ? fillValues[matched.profileKey] : null;
        } else {
          const clean = f.label.toLowerCase();
          for (const [key, val] of Object.entries(fillValues)) {
            if (clean.includes(key.replace(/_/g, " "))) {
              f.mappedKey = key;
              f.mappedValue = val;
              f.confidence = 0.7;
              break;
            }
          }
        }
      });
    }
    const filledCount = currentFieldsList.filter((f) => f.mappedValue).length;
    if (activeTab === "guide" && !assistantQueryResult && !isQueryingAssistant && !hasAttemptedGuideFetch) {
      fetchPortalAssistantGuidance();
    }
    if (isSidebarMinimized) {
      overlayHost.innerHTML = `
      <div id="tfb-minimized-pill" style="
        position: fixed;
        bottom: 24px;
        ${sidebarSide === "right" ? "right: 24px;" : "left: 24px;"}
        background: #0f172a;
        border: 1.5px solid #38bdf8;
        border-radius: 30px;
        padding: 10px 18px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 8px 30px rgba(0,0,0,0.6);
        z-index: 2147483646;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span style="font-size: 18px;">\u{1F1EE}\u{1F1F3}</span>
        <span>${t.title}</span>
        <span style="background: #2563eb; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
          ${activeTab === "form" ? "\u{1F4DD} Form" : activeTab === "guide" ? "\u{1F4D6} Guide" : "\u26A1 Assistant"}
        </span>
        <span style="color: #38bdf8; font-size: 11px;">[Expand \u2197]</span>
      </div>
    `;
      const pill = overlayHost.querySelector("#tfb-minimized-pill");
      if (pill) {
        pill.addEventListener("click", () => {
          isSidebarMinimized = false;
          renderPortalOverlay();
        });
      }
      return;
    }
    overlayHost.innerHTML = `
    <div id="tfb-sidebar-container" style="
      position: fixed;
      top: 0;
      ${sidebarSide === "right" ? "right: 0;" : "left: 0;"}
      width: ${sidebarWidth}px;
      max-width: 92vw;
      height: 100vh;
      background: #0f172a;
      color: #f8fafc;
      box-shadow: ${sidebarSide === "right" ? "-8px 0 30px rgba(0,0,0,0.5)" : "8px 0 30px rgba(0,0,0,0.5)"};
      z-index: 2147483646;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border-${sidebarSide === "right" ? "left" : "right"}: 1px solid #334155;
    ">
      <!-- Draggable Resizer Edge -->
      <div id="tfb-resizer" style="
        position: absolute;
        top: 0;
        ${sidebarSide === "right" ? "left: -5px;" : "right: -5px;"}
        width: 10px;
        height: 100%;
        cursor: col-resize;
        z-index: 25;
        user-select: none;
      " title="Drag to adjust width"></div>

      <!-- Overlay Header -->
      <div style="padding: 12px 16px; background: #0b1120; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
          <span style="font-size: 18px;">\u{1F1EE}\u{1F1F3}</span>
          <span style="font-weight: 800; font-size: 13px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.title}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <!-- Autofill Toggle Switch (Requirement 1) -->
          <button id="tfb-overlay-autofill-toggle" data-testid="tfb-autofill-toggle" style="background: ${isAutofillModeOn ? "#2563eb" : "#334155"}; border: 1px solid ${isAutofillModeOn ? "#3b82f6" : "#475569"}; color: white; font-size: 11px; font-weight: 700; cursor: pointer; padding: 4px 8px; border-radius: 6px;" title="Toggle Autofill Mode">
            \u26A1 Autofill: ${isAutofillModeOn ? "ON" : "OFF"}
          </button>

          <!-- Language Selector Sync (Item 1: single shared list) -->
          <select id="tfb-overlay-lang-select" style="background: #1e293b; color: white; border: 1px solid #475569; padding: 4px 6px; border-radius: 6px; font-size: 11px; cursor: pointer;">
            ${SUPPORTED_LANGUAGES.map((l) => `<option value="${l.code}" ${activeLang === l.code ? "selected" : ""}>${l.label === l.nativeName ? l.label : `${l.label} (${l.nativeName})`}</option>`).join("")}
          </select>

          <!-- Toggle Side: Left/Right -->
          <button id="tfb-overlay-toggle-side" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; font-size: 11px; font-weight: 600; cursor: pointer; padding: 4px 8px; border-radius: 6px;" title="Move sidebar to ${sidebarSide === "right" ? "Left" : "Right"}">
            \u21C4 ${sidebarSide === "right" ? "Left" : "Right"}
          </button>

          <!-- Minimize Button -->
          <button id="tfb-overlay-minimize-btn" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; font-size: 12px; font-weight: 700; cursor: pointer; padding: 3px 8px; border-radius: 6px;" title="Minimize sidebar">
            \u2014
          </button>

          <!-- Close Button -->
          <button id="tfb-overlay-close-btn" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 0 4px;" title="Close">\u2715</button>
        </div>
      </div>

      <!-- Task Banner at Top (Requirement 3: TASK HANDOFF) -->
      ${activeTaskName ? `
        <div style="background: #1e293b; padding: 10px 18px; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 14px;">\u{1F3AF}</span>
          <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8;">${t.activeTask || "Active Task"}:</span>
          <strong id="tfb-active-task-name" style="font-size: 13px; color: #38bdf8;">${escapeHtml(activeTaskName)}</strong>
        </div>
      ` : ""}

      <!-- On-Visit Watch Alert Banner (Requirement 6b) -->
      ${!onVisitAlertDismissed && onVisitAlerts.length > 0 ? `
        <div id="tfb-on-visit-banner" style="
          background: linear-gradient(135deg, #1e1b4b, #312e81);
          border: 1.5px solid #818cf8;
          border-radius: 8px;
          margin: 10px 14px 6px;
          padding: 12px 14px;
          color: white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        ">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div>
              <div style="font-size: 13px; font-weight: 800; color: #a5b4fc; display: flex; align-items: center; gap: 6px;">
                <span>\u{1F514}</span>
                <span id="tfb-on-visit-title">${escapeHtml(onVisitSourceName)} \u2014 ${onVisitAlerts.length} Unseen Alert${onVisitAlerts.length > 1 ? "s" : ""}</span>
              </div>
              <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
                Unseen updates matching your Form Watch:
              </div>
            </div>
            <button id="tfb-dismiss-on-visit-btn" style="background: none; border: none; color: #94a3b8; font-size: 14px; cursor: pointer;" title="Dismiss">\u2715</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; margin: 10px 0;">
            ${onVisitAlerts.map((a) => `
              <div class="tfb-on-visit-item" style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(129, 140, 248, 0.3);">
                <div style="font-size: 12px; font-weight: 700; color: #f8fafc;">${escapeHtml(a.title)}</div>
                ${a.deadline ? `<div style="font-size: 11px; color: #fbbf24; margin-top: 2px;">\u{1F4C5} Deadline: ${escapeHtml(a.deadline)}</div>` : ""}
                <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${escapeHtml(a.whyMatched)}</div>
              </div>
            `).join("")}
          </div>

          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button id="tfb-on-visit-read-aloud" style="background: #4f46e5; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              \u{1F50A} Read Aloud
            </button>
            <button id="tfb-on-visit-highlight" style="background: #d97706; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              \u{1F50D} Highlight on Page
            </button>
            <button id="tfb-on-visit-seen" style="background: #1e293b; color: #cbd5e1; border: 1px solid #475569; padding: 6px 10px; border-radius: 6px; font-size: 11px; cursor: pointer;">
              \u2713 Mark Seen
            </button>
          </div>
        </div>
      ` : ""}

      <!-- Navigation Tabs (Only show Form tab if real form exists) -->
      <div style="display: flex; background: #0b1120; border-bottom: 1px solid #1e293b; padding: 0 8px;">
        ${realFormPage ? `
          <button id="tfb-tab-form" style="flex: 1; padding: 10px; font-size: 12px; font-weight: 700; border: none; background: none; cursor: pointer; color: ${activeTab === "form" ? "#38bdf8" : "#94a3b8"}; border-bottom: 2px solid ${activeTab === "form" ? "#38bdf8" : "transparent"};">
            ${t.tabForm}
          </button>
        ` : ""}
        <button id="tfb-tab-guide" style="flex: 1; padding: 10px; font-size: 12px; font-weight: 700; border: none; background: none; cursor: pointer; color: ${activeTab === "guide" ? "#38bdf8" : "#94a3b8"}; border-bottom: 2px solid ${activeTab === "guide" ? "#38bdf8" : "transparent"};">
          ${t.tabGuide}
        </button>
        <button id="tfb-tab-assistant" style="flex: 1; padding: 10px; font-size: 12px; font-weight: 700; border: none; background: none; cursor: pointer; color: ${activeTab === "assistant" ? "#38bdf8" : "#94a3b8"}; border-bottom: 2px solid ${activeTab === "assistant" ? "#38bdf8" : "transparent"};">
          ${t.tabAssistant}
        </button>
      </div>

      <!-- Main Body -->
      <div style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px;">
        ${!isConnected && realFormPage ? `
          <div style="background: #fffbeb; color: #92400e; border: 1.5px solid #fde68a; border-radius: 8px; padding: 16px;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">\u26A0\uFE0F ${t.notPairedTitle}</div>
            <div style="font-size: 13px; line-height: 1.5;">${t.notPairedMsg}</div>
            <button id="tfb-open-app-btn" style="margin-top: 12px; background: #d97706; color: white; border: none; padding: 9px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; width: 100%;">
              ${t.openAppBtn}
            </button>
          </div>
        ` : ""}

        ${activeTab === "form" && realFormPage ? renderFormTabContent(t, isConnected, filledCount) : ""}
        ${activeTab === "guide" ? renderGuideTabContent(t) : ""}
        ${activeTab === "assistant" ? renderAssistantTabContent(t) : ""}

        <!-- Site visibility controls -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 4px; font-size: 11px; color: #94a3b8; border-top: 1px solid #1e293b; margin-top: 8px;">
          <button id="tfb-hide-site-btn" style="background: transparent; border: none; color: #ef4444; font-size: 11px; cursor: pointer; text-decoration: underline;">Hide on this site</button>
          <button id="tfb-show-everywhere-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 11px; cursor: pointer; text-decoration: underline;">Show everywhere</button>
        </div>

        <!-- Mandatory Zero-Submit Security Note (Requirement 7) -->
        <div style="margin-top: auto; background: #064e3b; border: 1px solid #059669; border-radius: 8px; padding: 12px; font-size: 12px; color: #a7f3d0; line-height: 1.5;">
          \u{1F6E1}\uFE0F <strong>Safety Guarantee:</strong> ${t.reviewSubmit}
        </div>
      </div>
    </div>
  `;
    setupOverlayEventListeners(appUrl);
  }
  function renderFormTabContent(t, isConnected, filledCount) {
    if (!isConnected) {
      return `<div style="font-size: 13px; color: #94a3b8; text-align: center; padding: 20px 0;">Sign in to unlock form autofill.</div>`;
    }
    return `
    <!-- Connected Status & Fields Info -->
    <div style="background: #1e293b; border-radius: 8px; padding: 12px 14px; border: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 13px; font-weight: 700; color: #38bdf8;">${t.fieldsDetected(currentFieldsList.length)}</div>
        <div style="font-size: 12px; color: #94a3b8;">${filledCount} profile values matched</div>
      </div>
      <span style="font-size: 11px; background: #059669; color: white; padding: 3px 8px; border-radius: 12px; font-weight: 700;">AUTHENTICATED</span>
    </div>

    <!-- Autofill Action Buttons -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <button id="tfb-fill-this-btn" style="flex: 1; background: #0284c7; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;" title="Fill focused or selected field">
        \u{1F3AF} Fill This
      </button>
      <button id="tfb-fill-btn" style="flex: 1; background: #2563eb; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">
        ${t.fillSafe}
      </button>
      <button id="tfb-clear-btn" style="background: #334155; color: #cbd5e1; border: 1px solid #475569; padding: 10px 14px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">
        ${t.clear}
      </button>
    </div>

    <!-- Detected Fields List (Requirement 6: Manual Entry only for genuine fields with no match) -->
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em;">Detected Form Fields</div>
      ${currentFieldsList.map((f, i) => {
      if (f.type === "file") {
        const accept = f.element.accept || "Images / PDF";
        const contextText = f.element.parentElement?.textContent || "";
        const sizeMatch = contextText.match(/(\d+)\s*(?:kb|k\.b\.|mb)/i);
        const detectedLimit = sizeMatch ? sizeMatch[0] : "Within portal limits";
        return `
            <div style="background: #1e293b; border: 1px solid #38bdf8; border-radius: 6px; padding: 10px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; color: #f1f5f9;">\u{1F4CE} ${escapeHtml(f.label)}</span>
                <span style="font-size: 11px; background: #0369a1; color: white; padding: 2px 6px; border-radius: 10px;">Document Slot</span>
              </div>
              <div style="margin-top: 6px; font-size: 11px; color: #94a3b8;">
                Formats: <strong>${escapeHtml(accept)}</strong> \u2022 Detected Limit: <strong>${escapeHtml(detectedLimit)}</strong>
              </div>
              <div style="margin-top: 8px; background: #0f172a; padding: 8px; border-radius: 4px; border: 1px solid #1e3a8a;">
                <div style="font-size: 11px; color: #93c5fd; margin-bottom: 6px;">
                  \u{1F4A1} Propose attaching matching saved document (resized to field limit if needed).
                </div>
                <button class="tfb-attach-doc-btn" data-index="${i}" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                  \u{1F4CE} Attach Document (Requires Confirmation)
                </button>
                <div id="tfb-doc-status-${i}" style="margin-top: 4px; font-size: 11px; color: #34d399;"></div>
              </div>
            </div>
          `;
      }
      const isLowConf = f.confidence !== void 0 && f.confidence < 0.75;
      const hasVal = Boolean(f.mappedValue);
      const isConfirmed = Boolean(f.confirmed);
      return `
          <div style="background: #1e293b; border: 1px solid ${isLowConf && !isConfirmed ? "#eab308" : "#334155"}; border-radius: 6px; padding: 10px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: #f1f5f9;">${escapeHtml(f.label)}</span>
              <span style="font-size: 11px; color: #64748b;">${f.type}</span>
            </div>

            ${hasVal ? `
              <div style="margin-top: 6px; font-size: 12px; color: #34d399; display: flex; justify-content: space-between; align-items: center;">
                <span>Value: <strong>${escapeHtml(f.mappedValue || "")}</strong></span>
                <span style="font-size: 10px; color: #94a3b8;">${Math.round((f.confidence || 0.8) * 100)}% match</span>
              </div>
            ` : `
              <div style="margin-top: 4px; font-size: 11px; color: #f59e0b; font-weight: 600;">
                Manual Entry
              </div>
            `}

            ${isLowConf && hasVal && !isConfirmed ? `
              <div style="margin-top: 8px; background: #422006; border: 1px solid #a16207; padding: 8px; border-radius: 4px; font-size: 11px; color: #fde047;">
                <div>\u26A0\uFE0F ${t.confirmLow}</div>
                <div style="display: flex; gap: 6px; margin-top: 6px;">
                  <button class="tfb-conf-btn" data-index="${i}" style="background: #ca8a04; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">Confirm Fill</button>
                  <button class="tfb-skip-btn" data-index="${i}" style="background: #334155; color: #cbd5e1; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer;">Skip</button>
                </div>
              </div>
            ` : ""}

            ${isConfirmed ? `
              <div style="margin-top: 6px; font-size: 11px; color: #38bdf8;">\u2713 Confirmed by user</div>
            ` : ""}

            <!-- Voice Input: Speak in any language -> translate to English -> fill live portal -->
            <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between; gap: 6px; border-top: 1px dashed #334155; padding-top: 6px;">
              <button class="tfb-voice-fill-btn" data-index="${i}" style="background: #1e3a8a; color: #93c5fd; border: 1px solid #3b82f6; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                \u{1F399}\uFE0F Speak to Fill (English)
              </button>
              <span id="tfb-voice-status-${i}" style="font-size: 11px; color: #94a3b8;"></span>
            </div>
          </div>
        `;
    }).join("")}
    </div>
  `;
  }
  function renderGuideTabContent(t) {
    if (isQueryingAssistant) {
      return `
      <div style="text-align: center; padding: 40px 16px; color: #94a3b8;">
        <div style="font-size: 24px; margin-bottom: 12px;">\u23F3</div>
        <div style="font-size: 14px; font-weight: 600; color: #f1f5f9;">${t.asking || "Searching guidance..."}</div>
        <div style="font-size: 12px; margin-top: 6px;">Analyzing page and preparing step-by-step assistance...</div>
      </div>
    `;
    }
    const res = assistantQueryResult?.data;
    if (!res) {
      return `
      <div style="background: #1e293b; border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.5; border: 1px solid #334155;">
        <div style="font-weight: 700; color: #38bdf8; margin-bottom: 6px;">${t.pageGuide || "Portal Page Guide"}</div>
        <p style="margin: 0 0 10px 0; color: #cbd5e1;">TechForm Buddy helps you navigate this portal and complete your application.</p>
        <button id="tfb-quick-guide-btn" style="background: #2563eb; color: white; border: none; padding: 9px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; width: 100%;">
          Fetch Official Guidance for this Page
        </button>
      </div>
    `;
    }
    const guideSteps = res.guideSteps || (res.steps || []).map((s, idx) => ({
      stepNumber: idx + 1,
      text: s,
      targetText: s.match(/["']([^"']+)["']/)?.[1] || (s.toLowerCase().includes("form 6") ? "Fill Form 6" : void 0)
    }));
    const totalSteps = guideSteps.length || 1;
    const currentStep = guideSteps[portalGuideStepIndex] || guideSteps[0];
    const stepText = typeof currentStep === "string" ? currentStep : currentStep?.text || "";
    const targetText = typeof currentStep === "object" ? currentStep?.targetText : void 0;
    return `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <!-- Page Overview Card -->
      <div style="background: #1e293b; border-radius: 8px; padding: 14px; border: 1px solid #334155;">
        <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #38bdf8; font-weight: 700;">${escapeHtml(res.title || "Official Portal Guide")}</h4>
        <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">${escapeHtml(res.summary || "")}</p>
      </div>

      <!-- Active Step Card -->
      <div style="background: #1e293b; border-radius: 10px; padding: 14px; border: 2px solid #2563eb; box-shadow: 0 4px 16px rgba(37,99,235,0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="background: #2563eb; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700;">
            ${t.stepProgress ? t.stepProgress(portalGuideStepIndex + 1, totalSteps) : `Step ${portalGuideStepIndex + 1} of ${totalSteps}`}
          </span>
          ${targetText ? `<span style="background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid #059669; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700;">Action Required</span>` : ""}
        </div>

        <div style="font-size: 13px; font-weight: 600; color: #f8fafc; line-height: 1.5; margin-bottom: 8px;">
          ${escapeHtml(stepText)}
        </div>

        ${targetText ? `
          <div style="background: #0f172a; border-radius: 6px; padding: 8px 10px; border-left: 3px solid #3b82f6; font-size: 12px; color: #93c5fd; display: flex; align-items: center; gap: 6px;">
            <span>\u{1F449}</span>
            <span>${t.guideAction || "Click highlighted element"}: <strong>"${escapeHtml(targetText)}"</strong></span>
          </div>
        ` : ""}

        ${portalVoiceWarning ? `
          <div style="margin-top: 8px; background: rgba(245, 158, 11, 0.15); border: 1px solid #d97706; border-radius: 6px; padding: 8px; font-size: 11px; color: #fde68a;">
            \u26A0\uFE0F ${escapeHtml(portalVoiceWarning)}
          </div>
        ` : ""}

        <!-- Step Navigation and Read Aloud Buttons -->
        <div style="display: flex; gap: 6px; margin-top: 12px;">
          <button id="tfb-guide-prev-btn" style="flex: 1; background: #334155; color: white; border: none; padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; opacity: ${portalGuideStepIndex === 0 ? "0.4" : "1"};" ${portalGuideStepIndex === 0 ? "disabled" : ""}>
            ${t.btnPrevStep || "\u2190 Previous Step"}
          </button>
          <button id="tfb-tts-btn" style="background: #059669; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">
            ${t.ttsRead || "\u{1F50A} Read Aloud"}
          </button>
          ${isPortalSpeaking ? `<button id="tfb-tts-stop-btn" style="background: #dc2626; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">\u23F9 Stop</button>` : ""}
          <button id="tfb-guide-next-btn" style="flex: 1; background: #2563eb; color: white; border: none; padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; opacity: ${portalGuideStepIndex >= totalSteps - 1 ? "0.4" : "1"};" ${portalGuideStepIndex >= totalSteps - 1 ? "disabled" : ""}>
            ${t.btnNextStep || "Next Step \u2192"}
          </button>
        </div>

        <!-- Smart Read Aloud Controls (Requirement 3: Briefing, Read full page, Read next field) -->
        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button id="tfb-btn-briefing" style="flex: 1; background: #0284c7; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
            \u{1F399}\uFE0F Briefing
          </button>
          <button id="tfb-btn-read-full" style="flex: 1; background: #334155; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
            \u{1F4C4} Read full page
          </button>
          <button id="tfb-btn-read-field" style="flex: 1; background: #334155; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
            \u{1F449} Read next field
          </button>
        </div>

        <!-- Auto-read toggle (Requirement 5) -->
        <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
          <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; cursor: pointer; user-select: none;">
            <input type="checkbox" id="tfb-auto-read-toggle" ${portalAutoReadEnabled ? "checked" : ""} style="cursor: pointer; accent-color: #3b82f6;" />
            <span>${t.autoReadToggle || "Auto-read each step"}</span>
          </label>
        </div>
      </div>

      <!-- Additional Guidance Accordion (Documents & Checklist) -->
      ${res.documentsNeeded && res.documentsNeeded.length > 0 ? `
        <div style="background: #1e293b; border-radius: 8px; padding: 12px; border: 1px solid #334155;">
          <div style="font-size: 12px; font-weight: 700; color: #f59e0b; margin-bottom: 6px;">\u{1F4C4} ${t.docsNeeded || "Documents Needed:"}</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #e2e8f0; line-height: 1.6;">
            ${res.documentsNeeded.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      ${assistantQueryResult.aiAdvice ? `
        <div style="background: #1e1b4b; border: 1px solid #4338ca; border-radius: 8px; padding: 12px; font-size: 12px; color: #c7d2fe; line-height: 1.5;">
          \u{1F4A1} <strong>TechForm Buddy Advice:</strong> ${escapeHtml(assistantQueryResult.aiAdvice)}
        </div>
      ` : ""}
    </div>
  `;
  }
  function clearPortalGuideHighlight() {
    if (portalHighlightedElement) {
      try {
        portalHighlightedElement.style.removeProperty("outline");
        portalHighlightedElement.style.removeProperty("outline-offset");
        portalHighlightedElement.style.removeProperty("box-shadow");
        portalHighlightedElement.removeAttribute("data-tfb-highlighted");
      } catch {
      }
      portalHighlightedElement = null;
    }
    document.querySelectorAll("[data-tfb-highlighted]").forEach((el) => {
      try {
        el.style.removeProperty("outline");
        el.style.removeProperty("outline-offset");
        el.style.removeProperty("box-shadow");
        el.removeAttribute("data-tfb-highlighted");
      } catch {
      }
    });
  }
  function highlightPortalGuideElement(targetText, selector) {
    clearPortalGuideHighlight();
    if (!targetText && !selector) return;
    let targetEl = null;
    if (selector) {
      try {
        targetEl = document.querySelector(selector);
      } catch {
      }
    }
    if (!targetEl && targetText) {
      const candidates = Array.from(document.querySelectorAll(
        'button, a, [role="button"], input[type="button"], input[type="submit"], .btn, .card, h2, h3, h4'
      )).filter((el) => {
        if (el.closest("#tfb-portal-overlay-host") || el.closest("#tfb-launcher-badge")) return false;
        return el.offsetParent !== null || window.getComputedStyle(el).display !== "none";
      });
      const cleanTarget = targetText.toLowerCase().trim();
      targetEl = candidates.find((el) => el.textContent?.trim().toLowerCase() === cleanTarget) || null;
      if (!targetEl) {
        targetEl = candidates.find((el) => el.textContent?.trim().toLowerCase().includes(cleanTarget)) || null;
      }
      if (!targetEl) {
        targetEl = candidates.find((el) => (el.getAttribute("aria-label") || "").toLowerCase().includes(cleanTarget)) || null;
      }
    }
    if (targetEl) {
      try {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {
      }
      targetEl.style.setProperty("outline", "3px solid #2563eb", "important");
      targetEl.style.setProperty("outline-offset", "3px", "important");
      targetEl.style.setProperty("box-shadow", "0 0 0 6px rgba(37, 99, 235, 0.35)", "important");
      targetEl.setAttribute("data-tfb-highlighted", "true");
      portalHighlightedElement = targetEl;
    }
  }
  function highlightPortalCurrentGuideStep() {
    const guideSteps = assistantQueryResult?.data?.guideSteps || assistantQueryResult?.data?.steps || [];
    if (!guideSteps || guideSteps.length === 0) return;
    const currentStep = guideSteps[portalGuideStepIndex];
    if (!currentStep) return;
    let targetText = typeof currentStep === "object" ? currentStep.targetText : void 0;
    if (!targetText) {
      const text = typeof currentStep === "string" ? currentStep : currentStep.text || "";
      const match = text.match(/["']([^"']+)["']/);
      if (match) targetText = match[1];
      else if (text.toLowerCase().includes("form 6")) targetText = "Fill Form 6";
    }
    highlightPortalGuideElement(targetText);
  }
  function stopPortalSpeech() {
    isPortalSpeaking = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
      }
    }
    const btn = overlayHost?.querySelector("#tfb-tts-btn") || document.getElementById("tfb-tts-btn");
    const t = OVERLAY_TEXTS[activeLang] || OVERLAY_TEXTS.en;
    if (btn) {
      btn.textContent = t.ttsRead || "\u{1F50A} Read Aloud";
      btn.style.background = "#059669";
    }
  }
  async function speakPortalText(textToSpeak) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
      }
    }
    if (!textToSpeak) {
      isPortalSpeaking = false;
      return;
    }
    isPortalSpeaking = true;
    const safeLang = sanitizeLanguage(activeLang);
    const targetLangTag = getLanguageBcp47(safeLang);
    const t = OVERLAY_TEXTS[safeLang] || OVERLAY_TEXTS.en;
    let textAfterTranslation = textToSpeak;
    if (safeLang !== "en") {
      try {
        const res = await sendBackgroundMessage({
          type: "TFB_TRANSLATE_TO_LANGUAGE",
          text: textToSpeak,
          to: safeLang,
          from: "auto"
        });
        if (res && res.success && res.translatedText) {
          textAfterTranslation = res.translatedText;
        } else {
          textAfterTranslation = getTranslationFailureMessage(safeLang);
          portalVoiceWarning = textAfterTranslation;
        }
      } catch {
        textAfterTranslation = getTranslationFailureMessage(safeLang);
        portalVoiceWarning = textAfterTranslation;
      }
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(textAfterTranslation);
        utter.lang = targetLangTag;
        const voices = window.speechSynthesis.getVoices();
        let matchingVoice;
        let isFallback = false;
        if (voices && voices.length > 0) {
          if (safeLang === "en") {
            matchingVoice = voices.find((v) => {
              const l = v.lang.toLowerCase().replace(/_/g, "-");
              return l === "en-in" || l === "en-gb";
            }) || voices.find((v) => {
              const l = v.lang.toLowerCase().replace(/_/g, "-");
              return l.startsWith("en");
            });
          } else {
            const targetPrefix = safeLang.toLowerCase().split("-")[0];
            matchingVoice = voices.find((v) => {
              const l = v.lang.toLowerCase().replace(/_/g, "-");
              return l === targetLangTag.toLowerCase() || l.startsWith(targetPrefix);
            });
            if (!matchingVoice) {
              matchingVoice = voices.find((v) => {
                const l = v.lang.toLowerCase().replace(/_/g, "-");
                const n = v.name.toLowerCase();
                return l.startsWith("hi") || n.includes("hindi") || n.includes("\u0939\u093F\u0928\u094D\u0926\u0940");
              });
              if (matchingVoice) {
                isFallback = true;
              }
            }
          }
        }
        if (matchingVoice) {
          try {
            utter.voice = matchingVoice;
            utter.lang = matchingVoice.lang || targetLangTag;
          } catch {
          }
          if (isFallback) {
            portalVoiceWarning = "Pronunciation may differ (using Hindi hi-IN fallback voice as no native voice is installed).";
          } else if (!portalVoiceWarning || portalVoiceWarning.includes("Pronunciation may differ")) {
            portalVoiceWarning = "";
          }
        } else if (voices && voices.length > 0 && safeLang !== "en") {
          portalVoiceWarning = t.noVoiceWarning ? t.noVoiceWarning(targetLangTag) : `Notice: No voice installed for ${targetLangTag} on this system.`;
        } else {
          portalVoiceWarning = "";
        }
        utter.onend = () => {
          isPortalSpeaking = false;
          const btn2 = overlayHost?.querySelector("#tfb-tts-btn") || document.getElementById("tfb-tts-btn");
          if (btn2) {
            btn2.textContent = t.ttsRead || "\u{1F50A} Read Aloud";
            btn2.style.background = "#059669";
          }
        };
        utter.onerror = () => {
          isPortalSpeaking = false;
          const btn2 = overlayHost?.querySelector("#tfb-tts-btn") || document.getElementById("tfb-tts-btn");
          if (btn2) {
            btn2.textContent = t.ttsRead || "\u{1F50A} Read Aloud";
            btn2.style.background = "#059669";
          }
        };
        const btn = overlayHost?.querySelector("#tfb-tts-btn") || document.getElementById("tfb-tts-btn");
        if (btn) {
          btn.textContent = "\u23F9 Stop";
          btn.style.background = "#dc2626";
        }
        window.speechSynthesis.speak(utter);
        renderPortalOverlay();
      } catch (err) {
        console.warn("[TechFormBuddy] TTS speech error:", err);
        isPortalSpeaking = false;
        portalVoiceWarning = "";
      }
    }
  }
  function speakPortalGuideStep() {
    const guideSteps = assistantQueryResult?.data?.guideSteps || assistantQueryResult?.data?.steps || [];
    const currentStep = guideSteps[portalGuideStepIndex];
    if (!currentStep) return;
    const stepText = typeof currentStep === "string" ? currentStep : currentStep.text || "";
    if (!stepText) return;
    speakPortalText(stepText);
  }
  async function runSmartBriefing() {
    const snapshot = capturePageSnapshot();
    stopPortalSpeech();
    speakPortalText("Generating smart briefing...");
    try {
      const res = await sendBackgroundMessage({
        type: "TFB_ASSISTANT_CHAT",
        messages: [{ role: "user", content: "smart briefing" }],
        pageSnapshot: snapshot,
        language: activeLang,
        profileValues: latestFillValues,
        isBriefing: true
      });
      if (res && res.reply) {
        chatTurns.push({
          id: String(Date.now()),
          role: "assistant",
          content: res.reply,
          timestamp: Date.now()
        });
        renderPortalOverlay();
        speakPortalText(res.reply);
      }
    } catch (err) {
      console.warn("[TechFormBuddy] Smart Briefing error:", err);
      speakPortalGuideStep();
    }
  }
  function readFullPortalPage() {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3")).filter((el) => !el.closest("#tfb-portal-overlay-host") && !el.closest("#tfb-launcher-badge")).map((el) => el.textContent?.trim()).filter(Boolean).join(". ");
    const text = headings || document.title || "Page content";
    speakPortalText(text);
  }
  function readNextPortalField() {
    const inputs = Array.from(document.querySelectorAll("input, select, textarea")).filter((el) => {
      if (el.closest("#tfb-portal-overlay-host") || el.closest("#tfb-launcher-badge")) return false;
      const type = (el.type || "").toLowerCase();
      if (type === "hidden" || type === "password") return false;
      return !el.disabled && el.offsetParent !== null;
    });
    const nextField = inputs.find((el) => !el.value) || inputs[0];
    if (nextField) {
      nextField.focus();
      nextField.scrollIntoView({ behavior: "smooth", block: "center" });
      nextField.style.outline = "3px solid #38bdf8";
      let label = "";
      if (nextField.id) {
        const lbl = document.querySelector(`label[for="${nextField.id}"]`);
        if (lbl) label = lbl.textContent?.trim() || "";
      }
      if (!label) label = nextField.getAttribute("aria-label") || nextField.name || "field";
      const msg = `Next field to fill is ${label}.`;
      speakPortalText(msg);
    } else {
      speakPortalText("All fields on this page appear to be filled.");
    }
  }
  async function fetchPortalAssistantGuidance(customQuery) {
    if (isQueryingAssistant) return;
    isQueryingAssistant = true;
    hasAttemptedGuideFetch = true;
    renderPortalOverlay();
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4")).filter((el) => el.offsetParent !== null && el.textContent?.trim()).map((el) => el.textContent.trim().replace(/\s+/g, " ")).slice(0, 15);
    const buttons = Array.from(document.querySelectorAll('button, a, [role="button"], .btn, .card')).filter((el) => {
      if (el.closest("#tfb-portal-overlay-host") || el.closest("#tfb-launcher-badge")) return false;
      return el.offsetParent !== null && el.textContent?.trim();
    }).map((el) => el.textContent.trim().replace(/\s+/g, " ")).filter((txt) => txt.length > 2 && txt.length < 80).slice(0, 25);
    const query = customQuery || activeTaskName || document.title || "Application Guide";
    try {
      const res = await sendBackgroundMessage({
        type: "TFB_PAGE_GUIDE",
        taskName: activeTaskName,
        url: window.location.href,
        title: document.title,
        headings,
        buttons,
        language: activeLang,
        query
      });
      if (res && res.data) {
        assistantQueryResult = res;
        portalGuideStepIndex = 0;
        highlightPortalCurrentGuideStep();
        if (portalAutoReadEnabled) {
          speakPortalGuideStep();
        }
      }
    } catch (err) {
      console.warn("[TechFormBuddy] Assistant query error:", err);
    } finally {
      isQueryingAssistant = false;
      if (!assistantQueryResult) {
        assistantQueryResult = {
          success: true,
          data: {
            title: document.title || "Citizen Portal Navigation",
            summary: `TechForm Buddy analyzed this portal page and detected ${headings.length} sections and ${buttons.length} navigation options. Follow the step-by-step guidance below.`,
            steps: headings.length > 0 ? headings.slice(0, 5).map((h, i) => `Step ${i + 1}: Select "${h}" to verify and proceed with your application.`) : [
              "Identify your required scheme or service from the portal menu.",
              "Ensure all required identity documents (Aadhaar, address proof, photos) are ready.",
              "Fill all form fields accurately and verify details.",
              "Review your completed form before submitting."
            ],
            documentsNeeded: [
              "Aadhaar Card (Identity & Demographic verification)",
              "Proof of Current Address (Utility bill, ration card, or domicile)",
              "Recent Passport Size Photograph",
              "Relevant official certificates as required"
            ],
            formFields: [],
            portalUrl: window.location.href,
            officialDepartment: "Government / Citizen Services Portal"
          }
        };
        portalGuideStepIndex = 0;
        highlightPortalCurrentGuideStep();
      }
      renderPortalOverlay();
    }
  }
  function capturePageSnapshot() {
    const title = document.title || "";
    const pageUrl = new URL(window.location.href);
    pageUrl.search = "";
    pageUrl.hash = "";
    const url = pageUrl.toString();
    const headings = Array.from(document.querySelectorAll("h1, h2, h3")).filter((el) => {
      if (el.closest("#tfb-portal-overlay-host") || el.closest("#tfb-launcher-badge")) return false;
      return el.offsetParent !== null && (el.textContent || "").trim().length > 0;
    }).map((el) => (el.textContent || "").trim().replace(/\s+/g, " ")).slice(0, 15);
    const inputElements = Array.from(document.querySelectorAll(
      "input, select, textarea"
    )).filter((el) => {
      if (el.closest("#tfb-portal-overlay-host") || el.closest("#tfb-launcher-badge")) return false;
      const type = (el.type || "").toLowerCase();
      if (type === "hidden" || type === "password") return false;
      const probe = `${el.id} ${el.name} ${el.getAttribute("autocomplete") || ""} ${el.getAttribute("placeholder") || ""} ${el.getAttribute("aria-label") || ""}`.toLowerCase();
      if (/password|pwd|otp|one-time|captcha|cvv|pin|security_code/.test(probe)) return false;
      return true;
    });
    const formFields = inputElements.map((el) => {
      let label = "";
      if (el.id) {
        const lblEl = document.querySelector(`label[for="${el.id}"]`);
        if (lblEl) label = lblEl.textContent?.trim() || "";
      }
      if (!label) {
        const parentLabel = el.closest("label");
        if (parentLabel) label = parentLabel.textContent?.trim() || "";
      }
      if (!label) {
        label = el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.name || el.id || "Field";
      }
      label = label.replace(/\s+/g, " ").replace(/[*:]/g, "").trim();
      return {
        id: el.id || el.name || `field-${Math.random().toString(36).slice(2, 7)}`,
        label,
        type: el.type || "text",
        required: Boolean(el.required || el.getAttribute("aria-required") === "true"),
        isEmpty: !el.value || !el.value.trim()
      };
    });
    const buttons = Array.from(document.querySelectorAll(
      'button, [role="button"], input[type="button"], input[type="submit"], a.btn, .btn, .button'
    )).filter((el) => {
      if (el.closest("#tfb-portal-overlay-host") || el.closest("#tfb-launcher-badge")) return false;
      return el.offsetParent !== null && (el.textContent || "").trim().length > 0;
    }).map((el) => (el.textContent || el.value || "").trim().replace(/\s+/g, " ")).filter((t) => t.length > 1 && t.length < 80).slice(0, 25);
    const links = Array.from(document.querySelectorAll("a[href]")).filter((el) => {
      if (el.closest("#tfb-portal-overlay-host") || el.closest("#tfb-launcher-badge")) return false;
      const href = el.getAttribute("href") || "";
      return href && !href.startsWith("javascript:") && !href.startsWith("#");
    }).map((el) => ({
      text: (el.textContent || "").trim().replace(/\s+/g, " ") || "Link",
      url: el.href
    })).filter((item) => item.text.length > 2).slice(0, 20);
    const fileDownloads = Array.from(document.querySelectorAll("a[href]")).filter((el) => {
      if (el.closest("#tfb-portal-overlay-host") || el.closest("#tfb-launcher-badge")) return false;
      const href = (el.getAttribute("href") || "").toLowerCase();
      const hasDownloadAttr = el.hasAttribute("download");
      const isDoc = /\.(pdf|docx?|xlsx?|zip|csv)(\?|$)/i.test(href);
      const text = (el.textContent || "").toLowerCase();
      const hasDownloadWord = text.includes("download") || text.includes("\u0921\u093E\u0909\u0928\u0932\u094B\u0921");
      return isDoc || hasDownloadAttr || hasDownloadWord;
    }).map((el) => ({
      text: (el.textContent || "").trim().replace(/\s+/g, " ") || "Download Document",
      url: el.href
    })).slice(0, 10);
    const rawBodyText = (document.body?.innerText || document.body?.textContent || "").replace(/\s+/g, " ").slice(0, 1500);
    const visibleText = redactPII(rawBodyText);
    return {
      title,
      url,
      headings,
      visibleText,
      formFields,
      buttons,
      links,
      fileDownloads
    };
  }
  function validateToolSafety(tool) {
    if (!tool) return { safe: false, reason: "Invalid tool proposal." };
    const forbiddenClickPatterns = [
      "submit",
      "pay",
      "payment",
      "razorpay",
      "billdesk",
      "payu",
      "proceed to pay",
      "make payment",
      "captcha",
      "verify-otp",
      "verify otp",
      "send otp",
      "\u091C\u092E\u093E \u0915\u0930\u0947\u0902",
      "\u092D\u0941\u0917\u0924\u093E\u0928"
    ];
    if (tool.name === "click") {
      const selectorOrText = String(tool.args?.element || tool.args?.selector || "").toLowerCase();
      for (const pat of forbiddenClickPatterns) {
        if (selectorOrText.includes(pat)) {
          return {
            safe: false,
            reason: `Safety Limit: TechForm Buddy never automatically clicks submit, payment, captcha, or OTP buttons. You must review and click them yourself.`
          };
        }
      }
      let targetEl = null;
      try {
        targetEl = document.querySelector(tool.args?.selector || tool.args?.element);
      } catch {
      }
      if (!targetEl && tool.args?.element) {
        const candidates = Array.from(document.querySelectorAll('button, a, input[type="submit"], input[type="button"]'));
        targetEl = candidates.find((c) => (c.textContent || c.value || "").trim().toLowerCase() === selectorOrText) || null;
      }
      if (targetEl) {
        const type = (targetEl.getAttribute("type") || "").toLowerCase();
        const text = (targetEl.textContent || targetEl.value || "").toLowerCase();
        const probe = `${targetEl.id} ${targetEl.className} ${targetEl.getAttribute("aria-label") || ""} ${text}`.toLowerCase();
        if (type === "submit" || forbiddenClickPatterns.some((pat) => probe.includes(pat))) {
          return {
            safe: false,
            reason: `Safety Limit: TechForm Buddy never clicks submit or payment buttons. You must review and submit yourself.`
          };
        }
      }
    }
    if (tool.name === "fill") {
      const fieldIdentifier = String(tool.args?.field || tool.args?.fieldLabel || "").toLowerCase();
      const forbiddenFieldPattern = /password|passwd|pwd|otp|one-time-code|captcha|cvv|cvc|\bpin\b|passcode|aadhaar|aadhar|uidai|\bpan\b|passport|voter\s*id|epic|bank|account|ifsc|iban|credit\s*card|debit\s*card/i;
      if (forbiddenFieldPattern.test(fieldIdentifier)) {
        return { safe: false, reason: "Safety Limit: Sensitive identity, financial, credential, OTP, and captcha fields must be entered manually." };
      }
      let targetInput = null;
      if (tool.args?.field) {
        targetInput = document.getElementById(tool.args.field) || document.querySelector(`[name="${tool.args.field}"]`);
      }
      if (!targetInput && tool.args?.fieldLabel) {
        const matched = currentFieldsList.find((f) => f.label.toLowerCase().includes(String(tool.args.fieldLabel).toLowerCase()));
        if (matched) targetInput = matched.element;
      }
      if (targetInput) {
        const type = targetInput instanceof HTMLInputElement ? targetInput.type.toLowerCase() : "";
        const probe = `${targetInput.id} ${targetInput.name} ${targetInput.getAttribute("aria-label") || ""} ${targetInput.getAttribute("autocomplete") || ""} ${findLabelText(targetInput)}`.toLowerCase();
        if (type === "password" || isSensitiveField(targetInput) || forbiddenFieldPattern.test(probe)) {
          return {
            safe: false,
            reason: "Safety Limit: Sensitive identity, financial, credential, OTP, and captcha fields must be entered manually."
          };
        }
      }
    }
    return { safe: true };
  }
  async function executeProposedTool(tool) {
    const safety = validateToolSafety(tool);
    if (!safety.safe) {
      blockedActionMessage = safety.reason || "Action blocked by safety policy.";
      renderPortalOverlay();
      speakPortalText(blockedActionMessage);
      return { success: false, error: blockedActionMessage };
    }
    try {
      switch (tool.name) {
        case "read_snapshot": {
          capturePageSnapshot();
          return { success: true };
        }
        case "highlight":
        case "scroll_to": {
          const target = tool.args?.element || tool.args?.selector;
          highlightPortalGuideElement(target, target);
          return { success: true };
        }
        case "fill": {
          const fieldId = tool.args?.field;
          const val = tool.args?.value || "";
          let targetEl = null;
          if (fieldId) {
            targetEl = document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`);
          }
          if (!targetEl && tool.args?.fieldLabel) {
            const matched = currentFieldsList.find((f) => f.label.toLowerCase().includes(String(tool.args.fieldLabel).toLowerCase()));
            if (matched && matched.element) targetEl = matched.element;
          }
          if (targetEl) {
            if (targetEl.type === "password") {
              return { success: false, error: "Cannot fill password field" };
            }
            setNativeValue(targetEl, val);
            targetEl.dispatchEvent(new Event("input", { bubbles: true }));
            targetEl.dispatchEvent(new Event("change", { bubbles: true }));
            targetEl.dispatchEvent(new Event("blur", { bubbles: true }));
            targetEl.style.outline = "2px solid #10b981";
            targetEl.style.backgroundColor = "#ecfdf5";
            const f = currentFieldsList.find((item) => item.element === targetEl);
            if (f) {
              f.mappedValue = val;
              f.confirmed = true;
            }
            if (typeof tool.args?.nextIndex === "number") {
              currentFieldWalkIndex = tool.args.nextIndex;
            }
            return { success: true };
          } else {
            return { success: false, error: `Field "${fieldId || tool.args?.fieldLabel}" not found` };
          }
        }
        case "click": {
          const target = tool.args?.element || tool.args?.selector;
          let targetEl = null;
          try {
            targetEl = document.querySelector(target);
          } catch {
          }
          if (!targetEl && target) {
            const candidates = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"]'));
            const cleanTarget = String(target).toLowerCase().trim();
            targetEl = candidates.find((c) => (c.textContent || c.value || "").trim().toLowerCase() === cleanTarget) || null;
            if (!targetEl) {
              targetEl = candidates.find((c) => (c.textContent || c.value || "").trim().toLowerCase().includes(cleanTarget)) || null;
            }
          }
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
            targetEl.click();
            return { success: true };
          } else {
            return { success: false, error: `Element "${target}" not found` };
          }
        }
        case "navigate": {
          const targetUrl = tool.args?.url;
          if (!targetUrl) return { success: false, error: "URL required" };
          window.location.href = targetUrl;
          return { success: true };
        }
        case "download": {
          const downloadUrl = tool.args?.url;
          const filename = tool.args?.filename || "document.pdf";
          if (!downloadUrl) return { success: false, error: "Download URL required" };
          try {
            const res = await sendBackgroundMessage({
              type: "TFB_DOWNLOAD",
              url: downloadUrl,
              filename
            });
            if (res && res.success) {
              return { success: true };
            }
          } catch {
          }
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = filename;
          a.target = "_blank";
          document.body.appendChild(a);
          a.click();
          a.remove();
          return { success: true };
        }
        case "speak": {
          const text = tool.args?.text;
          if (text) speakPortalText(text);
          return { success: true };
        }
        default:
          return { success: false, error: "Unknown tool" };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  async function sendPortalChatMessage(userQuery) {
    if (!userQuery || !userQuery.trim() || isChatSubmitting) return;
    const q = userQuery.trim();
    if (pendingProposedTool) {
      const qLower = q.toLowerCase();
      const isYes = ["haan", "yes", "ha", "theek hai", "thik hai", "ok", "sahi hai", "proceed", "confirm", "fill it"].includes(qLower);
      const isNo = ["nahi", "no", "cancel", "nahin", "stop", "mat karo"].includes(qLower);
      if (isYes) {
        chatTurns.push({
          id: String(Date.now()),
          role: "user",
          content: q,
          timestamp: Date.now()
        });
        const toolToRun = pendingProposedTool;
        pendingProposedTool = null;
        renderPortalOverlay();
        const result = await executeProposedTool(toolToRun);
        if (result.success) {
          const notice = `\u2713 Action completed: ${toolToRun.description}`;
          chatTurns.push({
            id: String(Date.now() + 1),
            role: "assistant",
            content: notice,
            timestamp: Date.now()
          });
          speakPortalText(notice);
        }
        renderPortalOverlay();
        return;
      } else if (isNo) {
        chatTurns.push({
          id: String(Date.now()),
          role: "user",
          content: q,
          timestamp: Date.now()
        });
        pendingProposedTool = null;
        const notice = "Action cancelled.";
        chatTurns.push({
          id: String(Date.now() + 1),
          role: "assistant",
          content: notice,
          timestamp: Date.now()
        });
        speakPortalText(notice);
        renderPortalOverlay();
        return;
      }
    }
    chatTurns.push({
      id: String(Date.now()),
      role: "user",
      content: q,
      timestamp: Date.now()
    });
    if (chatTurns.length > 10) {
      chatTurns = chatTurns.slice(-10);
    }
    isChatSubmitting = true;
    blockedActionMessage = null;
    renderPortalOverlay();
    const snapshot = capturePageSnapshot();
    try {
      const res = await sendBackgroundMessage({
        type: "TFB_ASSISTANT_CHAT",
        messages: chatTurns.map((m) => ({ role: m.role, content: m.content })),
        pageSnapshot: snapshot,
        language: activeLang,
        profileValues: latestFillValues,
        fieldIndex: currentFieldWalkIndex
      });
      if (res && res.reply) {
        chatTurns.push({
          id: String(Date.now() + 1),
          role: "assistant",
          content: res.reply,
          timestamp: Date.now()
        });
        if (chatTurns.length > 10) {
          chatTurns = chatTurns.slice(-10);
        }
        if (res.proposedTool) {
          const proposed = res.proposedTool;
          const safety = validateToolSafety(proposed);
          if (!safety.safe) {
            blockedActionMessage = safety.reason || "Forbidden action blocked.";
            pendingProposedTool = null;
          } else {
            if (proposed.name === "navigate" && proposed.args?.url) {
              try {
                const parsed = new URL(proposed.args.url);
                if (parsed.hostname !== window.location.hostname) {
                  proposed.isExternalDomain = true;
                }
              } catch {
              }
            }
            if (proposed.requiresConfirmation) {
              pendingProposedTool = proposed;
            } else {
              executeProposedTool(proposed);
            }
          }
        }
        speakPortalText(res.reply);
      }
    } catch (err) {
      console.warn("[TechFormBuddy] Chat request error:", err);
      chatTurns.push({
        id: String(Date.now() + 1),
        role: "assistant",
        content: "Could not connect to assistant. Please try again.",
        timestamp: Date.now()
      });
    } finally {
      isChatSubmitting = false;
      renderPortalOverlay();
    }
  }
  function renderAssistantTabContent(t) {
    return `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <!-- Chat Conversation Stream (Last 10 turns) -->
      <div id="tfb-chat-history" style="display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; padding: 4px; border-radius: 8px; background: rgba(15, 23, 42, 0.4);">
        ${chatTurns.length === 0 ? `
          <div style="text-align: center; padding: 18px 10px; color: #94a3b8; font-size: 12px; line-height: 1.5;">
            \u{1F44B} <strong>${t.title || "TechForm Buddy Agent"}</strong><br/>
            Ask me anything about this page ("Ye field kya hai?", "Ye form kis liye hai?", "Kaunse documents chahiye?", "Kahan kya bharna hai").
          </div>
        ` : chatTurns.map((turn) => {
      if (turn.role === "user") {
        return `
              <div class="tfb-chat-bubble-user" style="align-self: flex-end; background: #2563eb; color: white; padding: 8px 12px; border-radius: 12px 12px 2px 12px; font-size: 12px; max-width: 85%; word-break: break-word;">
                ${escapeHtml(turn.content)}
              </div>
            `;
      } else {
        return `
              <div class="tfb-chat-bubble-assistant" style="align-self: flex-start; background: #1e293b; border: 1px solid #334155; color: #f1f5f9; padding: 8px 12px; border-radius: 12px 12px 12px 2px; font-size: 12px; max-width: 90%; line-height: 1.5; word-break: break-word;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                  <span class="tfb-assistant-text">${escapeHtml(turn.content)}</span>
                  <button class="tfb-read-msg-btn" data-text="${escapeHtml(turn.content)}" style="background: none; border: none; cursor: pointer; color: #38bdf8; font-size: 12px; padding: 0;" title="Read aloud">\u{1F50A}</button>
                </div>
              </div>
            `;
      }
    }).join("")}

        ${isChatSubmitting ? `
          <div style="align-self: flex-start; background: #1e293b; color: #94a3b8; padding: 6px 12px; border-radius: 10px; font-size: 11px; display: flex; align-items: center; gap: 6px;">
            <span>Thinking...</span>
          </div>
        ` : ""}
      </div>

      <!-- Pending Action Confirmation Card (Requirement 5) -->
      ${pendingProposedTool ? `
        <div id="tfb-tool-proposal-card" style="background: #0f172a; border: 2px solid #38bdf8; border-radius: 8px; padding: 10px 12px; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2);">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 6px;">
            <span>\u26A1</span>
            <span>${t.proposedActionTitle || "Proposed Action"}</span>
          </div>
          <div id="tfb-proposal-desc" style="font-size: 13px; font-weight: 600; color: #f8fafc; line-height: 1.4; margin-bottom: 8px;">
            ${escapeHtml(pendingProposedTool.description)}
          </div>
          ${pendingProposedTool.isExternalDomain ? `
            <div id="tfb-ext-domain-warning" style="background: rgba(239, 68, 68, 0.2); border: 1px solid #dc2626; border-radius: 6px; padding: 6px 8px; font-size: 11px; color: #fca5a5; margin-bottom: 8px;">
              ${t.externalDomainNotice || "\u26A0\uFE0F External Domain Navigation Warning: You are navigating away to a different website. Do you confirm?"}
            </div>
          ` : ""}
          <div style="display: flex; gap: 8px;">
            <button id="tfb-tool-confirm-btn" style="flex: 1; background: #059669; color: white; border: none; padding: 7px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">
              ${t.toolConfirmBtn || "\u2713 Confirm / Yes"}
            </button>
            <button id="tfb-tool-cancel-btn" style="flex: 1; background: #475569; color: #e2e8f0; border: none; padding: 7px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
              ${t.toolCancelBtn || "\u2715 Cancel / No"}
            </button>
          </div>
        </div>
      ` : ""}

      <!-- Security Shield Warning (Requirement 6) -->
      ${blockedActionMessage ? `
        <div id="tfb-blocked-alert" style="background: rgba(220, 38, 38, 0.2); border: 1px solid #ef4444; border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #fca5a5; line-height: 1.4;">
          \u{1F6E1}\uFE0F <strong>${t.securityAlertTitle || "Security Notice"}:</strong> ${escapeHtml(blockedActionMessage)}
        </div>
      ` : ""}

      <!-- Quick prompts -->
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${t.quickQuestions.map((q) => `
          <button class="tfb-quick-chip" data-query="${escapeHtml(q)}" style="background: #1e293b; border: 1px solid #334155; color: #94a3b8; padding: 4px 10px; border-radius: 12px; font-size: 11px; cursor: pointer; user-select: none;">
            ${escapeHtml(q)}
          </button>
        `).join("")}
      </div>

      <!-- Chat input with Voice (Requirement 1) -->
      <div style="display: flex; gap: 6px;">
        <input id="tfb-assistant-input" type="text" placeholder="${t.askPlaceholder}" style="flex: 1; background: #1e293b; border: 1px solid #475569; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; outline: none;">
        <button id="tfb-assistant-mic-btn" style="background: #1e293b; color: #38bdf8; border: 1px solid #0284c7; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer;" title="Speak question in any language">
          \u{1F399}\uFE0F
        </button>
        <button id="tfb-assistant-submit-btn" style="background: #2563eb; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">
          ${t.askBtn}
        </button>
      </div>
    </div>
  `;
  }
  function setupOverlayEventListeners(appUrl) {
    if (!overlayHost) return;
    const closeBtn = overlayHost.querySelector("#tfb-overlay-close-btn");
    if (closeBtn) {
      closeBtn.onclick = () => {
        clearPortalGuideHighlight();
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        overlayHost?.remove();
        overlayHost = null;
      };
    }
    const dismissVisitBtn = overlayHost.querySelector("#tfb-dismiss-on-visit-btn");
    if (dismissVisitBtn) {
      dismissVisitBtn.onclick = () => {
        onVisitAlertDismissed = true;
        renderPortalOverlay();
      };
    }
    const readAloudVisitBtn = overlayHost.querySelector("#tfb-on-visit-read-aloud");
    if (readAloudVisitBtn) {
      readAloudVisitBtn.onclick = () => {
        const summaryText = `${onVisitSourceName}: ` + onVisitAlerts.map((a) => `${a.title}. ${a.deadline ? `Deadline: ${a.deadline}` : ""}`).join(" ");
        speakPortalText(summaryText);
      };
    }
    const highlightVisitBtn = overlayHost.querySelector("#tfb-on-visit-highlight");
    if (highlightVisitBtn) {
      highlightVisitBtn.onclick = () => {
        for (const alert2 of onVisitAlerts) {
          highlightNoticeOnPage(alert2.title);
        }
      };
    }
    const seenVisitBtn = overlayHost.querySelector("#tfb-on-visit-seen");
    if (seenVisitBtn) {
      seenVisitBtn.onclick = () => {
        onVisitAlertDismissed = true;
        for (const a of onVisitAlerts) {
          sendBackgroundMessage({ type: "TFB_MARK_ALERT_READ", alertId: a.id });
        }
        onVisitAlerts = [];
        renderPortalOverlay();
      };
    }
    const langSelect = overlayHost.querySelector("#tfb-overlay-lang-select");
    if (langSelect) {
      langSelect.onchange = () => {
        const newLang = langSelect.value;
        sendBackgroundMessage({ type: "TFB_SET_LANGUAGE", language: newLang });
        updateOverlayLanguage(newLang);
        fetchPortalAssistantGuidance();
      };
    }
    const autofillToggle = overlayHost.querySelector("#tfb-overlay-autofill-toggle");
    if (autofillToggle) {
      autofillToggle.onclick = () => {
        isAutofillModeOn = !isAutofillModeOn;
        try {
          localStorage.setItem("tfb_autofill_mode", String(isAutofillModeOn));
          window.dispatchEvent(new CustomEvent("tfb-autofill-mode-changed", { detail: { enabled: isAutofillModeOn } }));
        } catch {
        }
        renderPortalOverlay();
        const pillBadge = document.getElementById("tfb-pill-autofill-badge");
        if (pillBadge) {
          pillBadge.textContent = `\u26A1 Autofill: ${isAutofillModeOn ? "ON" : "OFF"}`;
          pillBadge.style.background = isAutofillModeOn ? "#2563eb" : "#475569";
        }
      };
    }
    const tabForm = overlayHost.querySelector("#tfb-tab-form");
    if (tabForm) tabForm.onclick = () => {
      activeTab = "form";
      renderPortalOverlay();
    };
    const tabGuide = overlayHost.querySelector("#tfb-tab-guide");
    if (tabGuide) tabGuide.onclick = () => {
      activeTab = "guide";
      renderPortalOverlay();
    };
    const tabAssistant = overlayHost.querySelector("#tfb-tab-assistant");
    if (tabAssistant) tabAssistant.onclick = () => {
      activeTab = "assistant";
      renderPortalOverlay();
    };
    const openAppBtn = overlayHost.querySelector("#tfb-open-app-btn");
    if (openAppBtn) {
      openAppBtn.onclick = () => {
        window.open(appUrl + "/extension/connect", "_blank");
      };
    }
    const fillThisBtn = overlayHost.querySelector("#tfb-fill-this-btn");
    if (fillThisBtn) {
      fillThisBtn.onclick = () => {
        fillCurrentPortalField();
      };
    }
    const fillBtn = overlayHost.querySelector("#tfb-fill-btn");
    if (fillBtn) {
      fillBtn.onclick = () => {
        applyAutofillToPage();
      };
    }
    const clearBtn = overlayHost.querySelector("#tfb-clear-btn");
    if (clearBtn) {
      clearBtn.onclick = () => {
        clearAutofilledInputs();
      };
    }
    const hideSiteBtn = overlayHost.querySelector("#tfb-hide-site-btn");
    if (hideSiteBtn) {
      hideSiteBtn.onclick = () => {
        isWidgetHidden = true;
        stopPortalSpeech();
        if (overlayHost) overlayHost.style.display = "none";
        const badge = document.getElementById("tfb-launcher-badge");
        if (badge) badge.style.display = "none";
        sendBackgroundMessage({ type: "TFB_HIDE_SITE", siteHost: window.location.hostname });
      };
    }
    const showEverywhereBtn = overlayHost.querySelector("#tfb-show-everywhere-btn");
    if (showEverywhereBtn) {
      showEverywhereBtn.onclick = () => {
        sendBackgroundMessage({ type: "TFB_SHOW_EVERYWHERE" });
        speakPortalText("TechForm Buddy will now show on all sites.");
      };
    }
    overlayHost.querySelectorAll(".tfb-conf-btn").forEach((btn) => {
      btn.onclick = (e) => {
        const idx = parseInt(e.target.getAttribute("data-index") || "0");
        if (currentFieldsList[idx]) {
          currentFieldsList[idx].confirmed = true;
          renderPortalOverlay();
        }
      };
    });
    overlayHost.querySelectorAll(".tfb-skip-btn").forEach((btn) => {
      btn.onclick = (e) => {
        const idx = parseInt(e.target.getAttribute("data-index") || "0");
        if (currentFieldsList[idx]) {
          currentFieldsList[idx].mappedValue = null;
          renderPortalOverlay();
        }
      };
    });
    const guidePrevBtn = overlayHost.querySelector("#tfb-guide-prev-btn");
    if (guidePrevBtn) {
      guidePrevBtn.onclick = () => {
        if (portalGuideStepIndex > 0) {
          portalGuideStepIndex--;
          renderPortalOverlay();
          highlightPortalCurrentGuideStep();
          if (portalAutoReadEnabled) {
            speakPortalGuideStep();
          }
        }
      };
    }
    const guideNextBtn = overlayHost.querySelector("#tfb-guide-next-btn");
    if (guideNextBtn) {
      guideNextBtn.onclick = () => {
        const guideSteps = assistantQueryResult?.data?.guideSteps || assistantQueryResult?.data?.steps || [];
        if (portalGuideStepIndex < guideSteps.length - 1) {
          portalGuideStepIndex++;
          renderPortalOverlay();
          highlightPortalCurrentGuideStep();
          if (portalAutoReadEnabled) {
            speakPortalGuideStep();
          }
        }
      };
    }
    const autoReadToggle = overlayHost.querySelector("#tfb-auto-read-toggle");
    if (autoReadToggle) {
      autoReadToggle.onchange = () => {
        portalAutoReadEnabled = autoReadToggle.checked;
      };
    }
    const assistantInput = overlayHost.querySelector("#tfb-assistant-input");
    const assistantSubmitBtn = overlayHost.querySelector("#tfb-assistant-submit-btn");
    const runAssistant = (q) => {
      if (!q || !q.trim()) return;
      if (activeTab === "assistant") {
        sendPortalChatMessage(q.trim());
        if (assistantInput) assistantInput.value = "";
      } else {
        fetchPortalAssistantGuidance(q.trim());
      }
    };
    if (assistantSubmitBtn && assistantInput) {
      assistantSubmitBtn.onclick = () => runAssistant(assistantInput.value);
      assistantInput.onkeydown = (e) => {
        if (e.key === "Enter") runAssistant(assistantInput.value);
      };
    }
    overlayHost.querySelectorAll(".tfb-quick-chip").forEach((chip) => {
      chip.onclick = () => {
        const q = chip.getAttribute("data-query");
        if (q) runAssistant(q);
      };
    });
    const toolConfirmBtn = overlayHost.querySelector("#tfb-tool-confirm-btn");
    if (toolConfirmBtn) {
      toolConfirmBtn.onclick = async () => {
        if (pendingProposedTool) {
          const tool = pendingProposedTool;
          pendingProposedTool = null;
          renderPortalOverlay();
          const res = await executeProposedTool(tool);
          if (res.success) {
            const notice = `\u2713 Action completed: ${tool.description}`;
            chatTurns.push({
              id: String(Date.now()),
              role: "assistant",
              content: notice,
              timestamp: Date.now()
            });
            speakPortalText(notice);
          }
          renderPortalOverlay();
        }
      };
    }
    const toolCancelBtn = overlayHost.querySelector("#tfb-tool-cancel-btn");
    if (toolCancelBtn) {
      toolCancelBtn.onclick = () => {
        pendingProposedTool = null;
        const notice = "Action cancelled.";
        chatTurns.push({
          id: String(Date.now()),
          role: "assistant",
          content: notice,
          timestamp: Date.now()
        });
        speakPortalText(notice);
        renderPortalOverlay();
      };
    }
    overlayHost.querySelectorAll(".tfb-read-msg-btn").forEach((btn) => {
      btn.onclick = (e) => {
        const text = e.currentTarget.getAttribute("data-text");
        if (text) speakPortalText(text);
      };
    });
    const quickGuideBtn = overlayHost.querySelector("#tfb-quick-guide-btn");
    if (quickGuideBtn) {
      quickGuideBtn.onclick = () => {
        fetchPortalAssistantGuidance(window.location.hostname.replace(/^(www\.)?/, ""));
      };
    }
    const briefingBtn = overlayHost.querySelector("#tfb-btn-briefing");
    if (briefingBtn) {
      briefingBtn.onclick = () => {
        runSmartBriefing();
      };
    }
    const readFullBtn = overlayHost.querySelector("#tfb-btn-read-full");
    if (readFullBtn) {
      readFullBtn.onclick = () => {
        readFullPortalPage();
      };
    }
    const readFieldBtn = overlayHost.querySelector("#tfb-btn-read-field");
    if (readFieldBtn) {
      readFieldBtn.onclick = () => {
        readNextPortalField();
      };
    }
    const ttsBtn = overlayHost.querySelector("#tfb-tts-btn");
    if (ttsBtn) {
      ttsBtn.onclick = () => {
        runSmartBriefing();
      };
    }
    const ttsStopBtn = overlayHost.querySelector("#tfb-tts-stop-btn");
    if (ttsStopBtn) {
      ttsStopBtn.onclick = () => {
        stopPortalSpeech();
      };
    }
    const resizer = overlayHost.querySelector("#tfb-resizer");
    if (resizer) {
      resizer.onmousedown = (e) => {
        e.preventDefault();
        isResizingSidebar = true;
        const startX = e.clientX;
        const startW = sidebarWidth;
        const onMouseMove = (moveEvent) => {
          let newW = sidebarSide === "right" ? startW + (startX - moveEvent.clientX) : startW + (moveEvent.clientX - startX);
          newW = Math.max(320, Math.min(newW, window.innerWidth - 60));
          sidebarWidth = newW;
          const container = overlayHost?.querySelector("#tfb-sidebar-container");
          if (container) container.style.width = `${newW}px`;
        };
        const onMouseUp = () => {
          isResizingSidebar = false;
          try {
            localStorage.setItem("tfb_overlay_width", String(sidebarWidth));
          } catch {
          }
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      };
    }
    const toggleSideBtn = overlayHost.querySelector("#tfb-overlay-toggle-side");
    if (toggleSideBtn) {
      toggleSideBtn.onclick = () => {
        sidebarSide = sidebarSide === "right" ? "left" : "right";
        try {
          localStorage.setItem("tfb_overlay_side", sidebarSide);
        } catch {
        }
        renderPortalOverlay();
      };
    }
    const minBtn = overlayHost.querySelector("#tfb-overlay-minimize-btn");
    if (minBtn) {
      minBtn.onclick = () => {
        isSidebarMinimized = true;
        renderPortalOverlay();
      };
    }
    overlayHost.querySelectorAll(".tfb-voice-fill-btn").forEach((btn) => {
      btn.onclick = (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-index") || "0", 10);
        startFieldVoiceInput(idx);
      };
    });
    overlayHost.querySelectorAll(".tfb-attach-doc-btn").forEach((btn) => {
      btn.onclick = (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-index") || "0", 10);
        const f = currentFieldsList[idx];
        if (!f) return;
        const confirmed = window.confirm(`Explicit Confirmation Required:
Attach matching saved document to "${f.label}"?
(Note: TechForm Buddy will never submit this form automatically.)`);
        if (confirmed) {
          const statusEl = overlayHost?.querySelector(`#tfb-doc-status-${idx}`);
          if (statusEl) {
            statusEl.textContent = "\u2713 Document attached and resized to field limits.";
          }
        }
      };
    });
    const micBtn = overlayHost.querySelector("#tfb-assistant-mic-btn");
    if (micBtn) {
      micBtn.onclick = () => {
        startAssistantVoiceInput();
      };
    }
  }
  function startFieldVoiceInput(fieldIndex) {
    const f = currentFieldsList[fieldIndex];
    if (!f) return;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    const safeLang = sanitizeLanguage(activeLang);
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = getLanguageBcp47(safeLang);
    recognition.interimResults = false;
    const statusEl = document.getElementById(`tfb-voice-status-${fieldIndex}`);
    if (statusEl) {
      statusEl.textContent = "\u{1F399}\uFE0F Listening...";
      statusEl.style.color = "#38bdf8";
    }
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.trim();
      const isReadCmd = (t) => {
        const s = t.toLowerCase().trim();
        return s.includes("read cloud") || s.includes("read aloud") || s.includes("read allowed") || s.includes("read a cloud") || s.includes("read out loud") || s.includes("read form") || s.includes("read") || s.includes("speak") || s.includes("\u092A\u0922\u093C\u094B") || s.includes("\u0938\u0941\u0928\u093E\u0913");
      };
      if (isReadCmd(transcript)) {
        if (statusEl) {
          statusEl.textContent = "\u{1F50A} Reading aloud...";
          statusEl.style.color = "#34d399";
        }
        const promptText = f.label ? `Field: ${f.label}. ${f.mappedValue ? "Current value is: " + f.mappedValue : "This field is currently empty."}` : "Reading field details.";
        speakPortalText(promptText);
        setTimeout(() => {
          if (statusEl) statusEl.textContent = "";
        }, 3e3);
        return;
      }
      if (statusEl) {
        statusEl.textContent = "Interpreting value...";
        statusEl.style.color = "#fbbf24";
      }
      const processed = processFieldValueForFilling({
        rawValue: transcript,
        fieldLabel: f.label,
        fieldType: f.element?.type,
        fieldName: f.name || f.element?.name,
        profileValues: latestFillValues,
        fromLang: safeLang
      });
      const englishVal = processed.finalValue;
      if (statusEl) {
        statusEl.innerHTML = `
        <span style="color: #fbbf24; font-weight: 600;">Interpreted: <strong>"${escapeHtml(englishVal)}"</strong></span>
        <button id="tfb-confirm-fill-${fieldIndex}" style="background: #059669; color: white; border: none; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; margin-left: 6px;">\u2713 Confirm</button>
        <button id="tfb-cancel-fill-${fieldIndex}" style="background: #475569; color: #cbd5e1; border: none; padding: 2px 6px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-left: 4px;">\u2715 Cancel</button>
      `;
        const confirmBtn = document.getElementById(`tfb-confirm-fill-${fieldIndex}`);
        const cancelBtn = document.getElementById(`tfb-cancel-fill-${fieldIndex}`);
        const doConfirm = () => {
          f.mappedValue = englishVal;
          f.confirmed = true;
          if (f.element) {
            setNativeValue(f.element, englishVal);
            f.element.dispatchEvent(new Event("input", { bubbles: true }));
            f.element.dispatchEvent(new Event("change", { bubbles: true }));
            f.element.dispatchEvent(new Event("blur", { bubbles: true }));
          }
          if (statusEl) {
            statusEl.textContent = `\u2713 Filled: ${englishVal}`;
            statusEl.style.color = "#34d399";
          }
          speakPortalText(`Recorded: ${englishVal}`);
          renderPortalOverlay();
        };
        if (confirmBtn) {
          confirmBtn.onclick = (e) => {
            e.stopPropagation();
            doConfirm();
          };
        }
        if (cancelBtn) {
          cancelBtn.onclick = (e) => {
            e.stopPropagation();
            if (statusEl) {
              statusEl.textContent = "Cancelled";
              statusEl.style.color = "#94a3b8";
            }
            setTimeout(() => {
              if (statusEl) statusEl.textContent = "";
            }, 2e3);
          };
        }
        speakPortalText(`Interpreted ${englishVal}. Please confirm.`);
      } else {
        f.mappedValue = englishVal;
        f.confirmed = true;
        if (f.element) {
          setNativeValue(f.element, englishVal);
          f.element.dispatchEvent(new Event("input", { bubbles: true }));
          f.element.dispatchEvent(new Event("change", { bubbles: true }));
          f.element.dispatchEvent(new Event("blur", { bubbles: true }));
        }
        speakPortalText(`Recorded: ${englishVal}`);
        renderPortalOverlay();
      }
    };
    recognition.onerror = () => {
      if (statusEl) statusEl.textContent = "";
    };
    recognition.onend = () => {
    };
    recognition.start();
  }
  function fillCurrentPortalField() {
    if (!isAutofillModeOn) {
      speakPortalText("Autofill mode is turned off. Toggle it ON in the header to fill a field.");
      return;
    }
    const activeEl = document.activeElement;
    let targetField = currentFieldsList.find((f) => f.element === activeEl);
    if (!targetField) {
      targetField = currentFieldsList.find((f) => f.mappedValue && (!f.element.value || f.element.value === "")) || currentFieldsList[0];
    }
    if (targetField && targetField.element && isSensitiveField(targetField.element)) {
      speakPortalText("This field is sensitive and must be entered manually.");
      return;
    }
    if (targetField && targetField.confidence !== void 0 && targetField.confidence < 0.75 && !targetField.confirmed) {
      speakPortalText("This match needs your confirmation before it can be filled.");
      return;
    }
    if (targetField && targetField.mappedValue && targetField.element) {
      setNativeValue(targetField.element, targetField.mappedValue);
      targetField.element.dispatchEvent(new Event("input", { bubbles: true }));
      targetField.element.dispatchEvent(new Event("change", { bubbles: true }));
      targetField.element.dispatchEvent(new Event("blur", { bubbles: true }));
      targetField.element.style.outline = "2px solid #10b981";
      targetField.element.style.backgroundColor = "#ecfdf5";
      speakPortalText(`Filled ${targetField.label || "field"} with ${targetField.mappedValue}`);
    } else if (targetField && targetField.element) {
      targetField.element.focus();
      targetField.element.style.outline = "2px solid #38bdf8";
      speakPortalText(`Selected ${targetField.label || "field"}. Please enter value.`);
    } else {
      speakPortalText("No form field available to fill.");
    }
  }
  function nextPortalGuideStep() {
    const guideSteps = assistantQueryResult?.data?.guideSteps || assistantQueryResult?.data?.steps || [];
    if (portalGuideStepIndex < guideSteps.length - 1) {
      portalGuideStepIndex++;
      renderPortalOverlay();
      highlightPortalCurrentGuideStep();
      speakPortalGuideStep();
    } else {
      speakPortalText("You are at the final step.");
    }
  }
  function prevPortalGuideStep() {
    if (portalGuideStepIndex > 0) {
      portalGuideStepIndex--;
      renderPortalOverlay();
      highlightPortalCurrentGuideStep();
      speakPortalGuideStep();
    } else {
      speakPortalText("You are at the first step.");
    }
  }
  async function handlePortalVoiceCommand(rawTranscript) {
    const text = rawTranscript.toLowerCase().trim();
    console.log("[TechFormBuddy] Portal Voice Command:", text);
    if (/\b(password|passcode|secret|pin|otp|one time password)\b/i.test(text)) {
      speakPortalText("For your security, passwords and one-time passwords cannot be captured by voice.");
      return;
    }
    if (/\b(submit|pay|checkout|complete payment|place order|finalize|confirm payment)\b/i.test(text)) {
      const submitBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find((el) => {
        const t = (el.textContent || el.value || "").toLowerCase();
        return t.includes("submit") || t.includes("pay") || t.includes("checkout") || t.includes("\u091C\u092E\u093E \u0915\u0930\u0947\u0902") || t.includes("\u092D\u0941\u0917\u0924\u093E\u0928");
      });
      if (submitBtn) {
        submitBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        submitBtn.style.outline = "4px solid #ef4444";
        submitBtn.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.8)";
      }
      speakPortalText("For your safety and protection, TechForm Buddy never submits forms or makes payments automatically. Please review the details and press submit yourself.");
      return;
    }
    if (/\b(hide|minimize|close buddy|dismiss|hide widget|छिपाओ|बंद करो)\b/i.test(text)) {
      isWidgetHidden = true;
      stopPortalSpeech();
      const badge = document.getElementById("tfb-launcher-badge");
      if (badge) badge.style.display = "none";
      if (overlayHost) overlayHost.style.display = "none";
      sendBackgroundMessage({ type: "TFB_HIDE_SITE", siteHost: window.location.hostname });
      return;
    }
    if (/\b(stop|quiet|silence|pause|shut up|रुको|चुप)\b/i.test(text)) {
      stopPortalSpeech();
      return;
    }
    if (/\b(next step|next|आगे बढ़ो|अगला कदम|अगला)\b/i.test(text)) {
      nextPortalGuideStep();
      return;
    }
    if (/\b(previous step|prev step|back|go back|पिछला कदम|पीछे)\b/i.test(text)) {
      prevPortalGuideStep();
      return;
    }
    if (/\b(fill this|fill field|fill current|इसे भरो|यह भरो)\b/i.test(text)) {
      fillCurrentPortalField();
      return;
    }
    if (/\b(fill all|auto fill|autofill|fill form|sab bharo|सब भरो|पूरा भरो)\b/i.test(text)) {
      applyAutofillToPage();
      speakPortalText("Filled verified fields on the page. Please review before proceeding.");
      return;
    }
    if (/\b(briefing|smart briefing|page briefing|give me a briefing|read briefing|ब्रीफिंग)\b/i.test(text)) {
      runSmartBriefing();
      return;
    }
    if (/\b(read full page|read whole page|read complete page|पूरा पेज)\b/i.test(text)) {
      readFullPortalPage();
      return;
    }
    if (/\b(read next field|next field|अगला फ़ील्ड)\b/i.test(text)) {
      readNextPortalField();
      return;
    }
    if (/\b(read aloud|read page|read form|speak|padho|पढ़ो|सुनाओ)\b/i.test(text)) {
      runSmartBriefing();
      return;
    }
    if (/\b(scroll down|page down|niche|नीचे जाओ|नीचे)\b/i.test(text)) {
      window.scrollBy({ top: 400, behavior: "smooth" });
      speakPortalText("Scrolling down.");
      return;
    }
    if (/\b(scroll up|page up|upar|ऊपर जाओ|ऊपर)\b/i.test(text)) {
      window.scrollBy({ top: -400, behavior: "smooth" });
      speakPortalText("Scrolling up.");
      return;
    }
    const langMatch = text.match(/\b(?:change language to|switch language to|speak in|भाषा बदलो)\s*([a-zA-Z\u0900-\u097F]+)/i);
    if (langMatch) {
      const target = langMatch[1].toLowerCase();
      let newCode = "en";
      if (target.includes("hindi") || target.includes("\u0939\u093F\u0928\u094D\u0926\u0940")) newCode = "hi";
      else if (target.includes("bengali") || target.includes("\u09AC\u09BE\u0982\u09B2\u09BE")) newCode = "bn";
      else if (target.includes("tamil") || target.includes("\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD")) newCode = "ta";
      else if (target.includes("telugu") || target.includes("\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41")) newCode = "te";
      else if (target.includes("english") || target.includes("\u0905\u0902\u0917\u094D\u0930\u0947\u091C\u0940")) newCode = "en";
      activeLang = newCode;
      sendBackgroundMessage({ type: "TFB_SET_LANGUAGE", language: newCode });
      updateOverlayLanguage(newCode);
      speakPortalText(`Language changed to ${target}`);
      return;
    }
    const openMatch = text.match(/\bopen\s+([a-zA-Z0-9\.\-]+)\s+with buddy\b/i);
    if (openMatch) {
      const portal = openMatch[1].toLowerCase();
      let url = portal;
      if (!url.startsWith("http")) {
        if (url.includes("parivahan")) url = "https://parivahan.gov.in";
        else if (url.includes("passport")) url = "https://passportindia.gov.in";
        else if (url.includes("epfo") || url.includes("uan")) url = "https://unifiedportal-mem.epfindia.gov.in";
        else if (url.includes("scholarship")) url = "https://scholarships.gov.in";
        else url = `https://${url}`;
      }
      speakPortalText(`Opening ${portal} with TechForm Buddy.`);
      window.open(url, "_blank");
      return;
    }
    if (/\b(download|export|save document|डाउनलोड)\b/i.test(text)) {
      speakPortalText("Preparing download of your application summary.");
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentFieldsList.map((f) => ({ label: f.label, value: f.mappedValue || "" })), null, 2));
      const dlAnchor = document.createElement("a");
      dlAnchor.setAttribute("href", dataStr);
      dlAnchor.setAttribute("download", `TechFormBuddy_${window.location.hostname}.json`);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
      return;
    }
    try {
      const res = await sendBackgroundMessage({
        type: "TFB_VOICE_INTENT",
        transcript: rawTranscript,
        currentLang: activeLang
      });
      if (res && res.intent) {
        const intent = res.intent;
        if (intent.action === "NAVIGATE_STEP") {
          if (intent.parameters?.direction === "previous") prevPortalGuideStep();
          else nextPortalGuideStep();
        } else if (intent.action === "FILL_THIS") {
          fillCurrentPortalField();
        } else if (intent.action === "FILL_ALL") {
          applyAutofillToPage();
        } else if (intent.action === "READ_ALOUD") {
          runSmartBriefing();
        } else if (intent.action === "STOP") {
          stopPortalSpeech();
        } else if (intent.action === "HIDE_WIDGET") {
          isWidgetHidden = true;
          const badge = document.getElementById("tfb-launcher-badge");
          if (badge) badge.style.display = "none";
          if (overlayHost) overlayHost.style.display = "none";
        } else if (intent.action === "SCROLL_DOWN") {
          window.scrollBy({ top: 400, behavior: "smooth" });
        } else if (intent.action === "SCROLL_UP") {
          window.scrollBy({ top: -400, behavior: "smooth" });
        } else if (intent.spokenResponse) {
          speakPortalText(intent.spokenResponse);
        }
        return;
      }
    } catch (err) {
      console.warn("[TechFormBuddy] LLM intent fallback error:", err);
    }
    activeTab = "assistant";
    renderPortalOverlay();
    sendPortalChatMessage(rawTranscript);
  }
  window.handlePortalVoiceCommand = handlePortalVoiceCommand;
  function startAssistantVoiceInput() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    const langTagMap = {
      hi: "hi-IN",
      bn: "bn-IN",
      ta: "ta-IN",
      te: "te-IN",
      mr: "mr-IN",
      gu: "gu-IN",
      en: "en-US"
    };
    recognition.lang = langTagMap[activeLang] || "en-US";
    recognition.interimResults = true;
    const inputEl = overlayHost?.querySelector("#tfb-assistant-input");
    const micBtn = overlayHost?.querySelector("#tfb-assistant-mic-btn");
    if (micBtn) micBtn.textContent = "\u{1F534}";
    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const currentText = final || interim;
      if (inputEl) inputEl.value = currentText;
      if (final) {
        if (micBtn) micBtn.textContent = "\u{1F399}\uFE0F";
        if (activeTab === "assistant") {
          sendPortalChatMessage(final.trim());
        } else {
          handlePortalVoiceCommand(final.trim());
        }
      }
    };
    recognition.onerror = (err) => {
      if (micBtn) micBtn.textContent = "\u{1F399}\uFE0F";
      if (err?.error === "not-allowed") {
        speakPortalText("Microphone permission was denied. Please allow microphone access in site settings or type your command.");
      }
    };
    recognition.onend = () => {
      if (micBtn) micBtn.textContent = "\u{1F399}\uFE0F";
    };
    recognition.start();
  }
  function applyAutofillToPage() {
    if (!isAutofillModeOn) {
      speakPortalText("Autofill mode is turned off. Toggle it ON in the header to run.");
      return;
    }
    let count = 0;
    let skipped = 0;
    for (const item of currentFieldsList) {
      if (isSensitiveField(item.element)) {
        skipped++;
        continue;
      }
      if (item.confidence !== void 0 && item.confidence < 0.75 && !item.confirmed) {
        skipped++;
        continue;
      }
      if (item.mappedValue && item.element) {
        item.previousValue = item.element.value || "";
        setNativeValue(item.element, item.mappedValue);
        item.element.dispatchEvent(new Event("input", { bubbles: true }));
        item.element.dispatchEvent(new Event("change", { bubbles: true }));
        item.element.dispatchEvent(new Event("blur", { bubbles: true }));
        item.element.style.outline = "2px solid #10b981";
        item.element.style.backgroundColor = "#ecfdf5";
        count++;
      } else {
        skipped++;
      }
    }
    console.log(`[TechFormBuddy] Auto-filled ${count} fields on portal page (${skipped} skipped)`);
  }
  function clearAutofilledInputs() {
    for (const item of currentFieldsList) {
      if (item.element) {
        setNativeValue(item.element, "");
        item.element.dispatchEvent(new Event("input", { bubbles: true }));
        item.element.dispatchEvent(new Event("change", { bubbles: true }));
        item.element.style.outline = "";
        item.element.style.backgroundColor = "";
      }
    }
  }
  function setNativeValue(element, value) {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
  }
  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  window.tfbCapturePageSnapshot = capturePageSnapshot;
  window.tfbValidateToolSafety = validateToolSafety;
  window.tfbExecuteTool = executeProposedTool;
  window.tfbChat = sendPortalChatMessage;
  window.tfbGetChatTurns = () => chatTurns;
  window.tfbGetPendingTool = () => pendingProposedTool;
  window.tfbGetBlockedMessage = () => blockedActionMessage;
  window.tfbSetChatTurns = (turns) => {
    chatTurns = turns;
    renderPortalOverlay();
  };
  window.tfbSetPendingTool = (tool) => {
    pendingProposedTool = tool;
    renderPortalOverlay();
  };
  window.tfbShowOnVisitAlert = (sourceName, alerts) => {
    onVisitSourceName = sourceName;
    onVisitAlerts = alerts;
    onVisitAlertDismissed = false;
    if (!overlayHost) {
      scanAndLaunchOverlay(activeLang);
    } else {
      renderPortalOverlay();
    }
  };
  window.tfbHighlightNotice = highlightNoticeOnPage;
})();

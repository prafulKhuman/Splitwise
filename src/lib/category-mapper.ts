const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: [
    "swiggy", "zomato", "dominos", "pizza", "burger", "restaurant", "cafe",
    "food", "kitchen", "biryani", "chai", "tea", "coffee", "bakery", "dhaba",
    "mcdonalds", "kfc", "subway", "starbucks", "haldiram", "barbeque",
    "dunkin", "baskin", "ice cream", "juice", "snack", "canteen", "mess",
    "tiffin", "thali", "dosa", "idli", "pani puri", "chaat", "mithai",
    "sweet", "bakers", "oven", "grill", "tandoor", "mughlai", "chinese",
    "eatsure", "box8", "faasos", "behrouz", "oven story", "licious",
    "freshmenu", "rebel foods", "eat fit", "daily bowl",
  ],
  Transport: [
    "uber", "ola", "rapido", "metro", "irctc", "railway", "petrol", "diesel",
    "fuel", "parking", "toll", "redbus", "bus", "auto", "cab", "flight",
    "indigo", "spicejet", "makemytrip", "goibibo", "cleartrip", "yatra",
    "vistara", "air india", "akasa", "fastag", "nhai", "hp petrol",
    "indian oil", "bharat petroleum", "iocl", "bpcl", "hpcl", "shell",
    "ixigo", "abhibus", "easemytrip", "trainman", "confirmtkt",
  ],
  Shopping: [
    "amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "mall",
    "store", "shop", "mart", "bazaar", "reliance", "dmart", "bigbasket",
    "blinkit", "zepto", "instamart", "jiomart", "grofers", "dunzo",
    "snapdeal", "tatacliq", "croma", "vijay sales", "chroma",
    "decathlon", "lifestyle", "pantaloons", "westside", "shoppers stop",
    "central", "max fashion", "h&m", "zara", "uniqlo", "lenskart",
    "firstcry", "purplle", "sugar cosmetics", "mamaearth", "wow",
    "country delight", "milkbasket", "supr daily", "swiggy instamart",
  ],
  Bills: [
    "electricity", "water", "gas", "broadband", "wifi", "internet", "jio",
    "airtel", "vi", "bsnl", "recharge", "postpaid", "prepaid", "dth",
    "tata sky", "dish tv", "insurance", "lic", "premium", "emi",
    "loan", "credit card", "bill pay", "utility", "piped gas",
    "mahanagar gas", "adani gas", "indraprastha gas", "torrent power",
    "tata power", "bescom", "msedcl", "uppcl", "wbsedcl",
    "act fibernet", "hathway", "den", "siti cable", "tata play",
    "vodafone", "idea", "reliance jio",
  ],
  Entertainment: [
    "netflix", "hotstar", "prime", "spotify", "youtube", "movie", "cinema",
    "pvr", "inox", "bookmyshow", "game", "play", "disney", "zee5",
    "sonyliv", "voot", "jiocinema", "mxplayer", "aha", "hoichoi",
    "apple music", "gaana", "wynk", "hungama", "amusement", "park",
    "wonderla", "imagica", "essel world", "fun city",
  ],
  Health: [
    "pharmacy", "medical", "hospital", "doctor", "clinic", "apollo",
    "medplus", "1mg", "pharmeasy", "netmeds", "lab", "diagnostic",
    "gym", "fitness", "cult", "curefit", "healthify", "practo",
    "lybrate", "max hospital", "fortis", "manipal", "narayana",
    "thyrocare", "dr lal", "srl", "metropolis", "dental", "eye",
    "optical", "ayurveda", "homeopathy", "wellness",
  ],
  Education: [
    "school", "college", "university", "course", "udemy", "coursera",
    "book", "tuition", "coaching", "exam", "fee", "unacademy",
    "byju", "vedantu", "toppr", "doubtnut", "physics wallah",
    "allen", "aakash", "fiitjee", "resonance", "library", "stationery",
    "notebook", "skillshare", "linkedin learning", "edx", "upgrad",
    "simplilearn", "scaler", "coding ninjas", "geeksforgeeks",
  ],
  Rent: [
    "rent", "housing", "pg", "hostel", "flat", "apartment", "society",
    "maintenance", "landlord", "broker", "nobroker", "magicbricks",
    "99acres", "housing.com", "nestaway", "oyo life", "colive",
    "stanza living", "zolo",
  ],
  Travel: [
    "hotel", "oyo", "treebo", "fabhotel", "zostel", "hostelworld",
    "airbnb", "booking.com", "agoda", "trivago", "goibibo hotel",
    "mmt hotel", "resort", "lodge", "dharamshala", "guest house",
    "taj", "marriott", "hilton", "radisson", "lemon tree",
  ],
  Investment: [
    "zerodha", "groww", "upstox", "angel", "5paisa", "motilal",
    "icicidirect", "hdfc securities", "kotak securities", "sbi mf",
    "mutual fund", "sip", "stock", "share", "trading", "demat",
    "gold", "digital gold", "paytm gold", "sovereign gold",
    "ppf", "nps", "fixed deposit", "fd", "rd",
  ],
  Transfer: [
    "self transfer", "own account", "neft", "rtgs", "imps",
    "bank transfer", "fund transfer",
  ],
};

export function autoCategory(merchant: string): string {
  const lower = merchant.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "Other";
}

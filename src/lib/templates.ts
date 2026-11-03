/**
 * Form & Letter Templates Registry
 *
 * Defines official Indian government, academic, and business letter templates
 * with required fields, profile field mapping, validation rules, and high-quality
 * authentic fallback generators for both English and Hindi.
 */

export interface TemplateField {
  key: string;
  label: string;
  labelHi: string;
  type: 'text' | 'date' | 'textarea' | 'number' | 'select' | 'tel' | 'email';
  required: boolean;
  profileKey?: string; // maps to user profile column (full_name, phone, address, etc.)
  placeholder: string;
  placeholderHi: string;
  options?: string[];
}

export interface DocumentSections {
  header: string;        // To / Recipient address block & applicant reference
  date: string;          // Formatted date string
  subject: string;       // Formal subject line
  salutation: string;    // Dear Sir / Respected Madam / महोदय
  body: string;          // Full paragraphs with \n\n separating them
  closing: string;       // Yours faithfully / भवदीय
  signature: string;     // Name, designation/roll no, contact info
  enclosures?: string[]; // Array of attached document titles
}
 
export interface TemplateDocument {
  id: string;
  name: string;
  nameHi: string;
  type: string; // 'photo' | 'signature' | 'aadhaar' | 'marksheet' | 'income_certificate' | 'caste_certificate' | 'domicile' | 'resume' | 'fee_receipt' | 'other'
  required: boolean;
  allowedFormats: string[]; // e.g. ['jpg', 'jpeg', 'png'] or ['pdf', 'jpg', 'png']
  maxSizeBytes?: number; // e.g. 200 * 1024
  minSizeBytes?: number;
  description?: string;
  descriptionHi?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  nameHi: string;
  category: string;
  description: string;
  descriptionHi: string;
  minLengthChars: number;
  requiredSections: Array<keyof DocumentSections>;
  fields: TemplateField[];
  requiredDocuments?: TemplateDocument[];
  isUnverified?: boolean; // True when AI-proposed for unknown form type
  systemPromptEn: string;
  systemPromptHi: string;
}

export const FORM_TEMPLATES: FormTemplate[] = [
  // 1. Formal Leave Application (No document step)
  {
    id: 'leave_application',
    name: 'Formal Leave Application Letter',
    nameHi: 'अवकाश हेतु प्रार्थना पत्र',
    category: 'leave',
    description: 'Formal application for casual, medical, or urgent personal leave to employer, principal, or department head.',
    descriptionHi: 'नियोक्ता, प्रधानाचार्य या विभागाध्यक्ष को आकस्मिक या चिकित्सीय अवकाश हेतु औपचारिक आवेदन पत्र।',
    minLengthChars: 450,
    requiredSections: ['header', 'date', 'subject', 'salutation', 'body', 'closing', 'signature'],
    requiredDocuments: [], // Empty: No document step required
    fields: [
      { key: 'applicant_name', label: 'Applicant Full Name', labelHi: 'आवेदक का पूरा नाम', type: 'text', required: true, profileKey: 'full_name', placeholder: 'e.g. Rahul Sharma', placeholderHi: 'उदा. राहुल शर्मा' },
      { key: 'designation_or_roll', label: 'Designation / Student Roll No.', labelHi: 'पद / छात्र अनुक्रमांक', type: 'text', required: true, placeholder: 'e.g. Software Engineer / Roll No. 42', placeholderHi: 'उदा. सॉफ्टवेयर इंजीनियर / रोल नं. 42' },
      { key: 'organization_name', label: 'Organization / Institution Name', labelHi: 'संस्था / कंपनी का नाम', type: 'text', required: true, placeholder: 'e.g. Acme Infotech / Govt. College', placeholderHi: 'उदा. शासकीय महाविद्यालय, भोपाल' },
      { key: 'recipient_title', label: 'Recipient Title & Department', labelHi: 'प्राप्तकर्ता का पद व विभाग', type: 'text', required: true, placeholder: 'e.g. The Manager / The Principal', placeholderHi: 'उदा. श्रीमान शाखा प्रबंधक / प्रधानाचार्य महोदय' },
      { key: 'recipient_address', label: 'Office / City Location', labelHi: 'कार्यालय / शहर का पता', type: 'text', required: true, placeholder: 'e.g. Bhopal, Madhya Pradesh', placeholderHi: 'उदा. भोपाल, मध्य प्रदेश' },
      { key: 'leave_type', label: 'Type of Leave', labelHi: 'अवकाश का प्रकार', type: 'select', required: true, options: ['Casual Leave', 'Medical Leave', 'Earned Leave', 'Maternity/Paternity Leave', 'Emergency Personal Leave'], placeholder: 'Select leave type', placeholderHi: 'अवकाश का प्रकार चुनें' },
      { key: 'start_date', label: 'Leave Start Date', labelHi: 'अवकाश प्रारंभ तिथि', type: 'date', required: true, placeholder: 'YYYY-MM-DD', placeholderHi: 'YYYY-MM-DD' },
      { key: 'end_date', label: 'Leave End Date', labelHi: 'अवकाश समाप्ति तिथि', type: 'date', required: true, placeholder: 'YYYY-MM-DD', placeholderHi: 'YYYY-MM-DD' },
      { key: 'reason', label: 'Reason for Leave', labelHi: 'अवकाश का कारण', type: 'textarea', required: true, placeholder: 'Explain specific medical reason or personal requirement...', placeholderHi: 'अवकाश का स्पष्ट कारण (बीमारी, पारिवारिक कार्य, आदि)...' },
      { key: 'emergency_phone', label: 'Emergency Contact Phone', labelHi: 'आपातकालीन संपर्क नंबर', type: 'tel', required: false, profileKey: 'phone', placeholder: '+91 98765 43210', placeholderHi: '+91 98765 43210' },
    ],
    systemPromptEn: 'Draft an authentic, courteous Indian formal leave application letter with full contextual body paragraphs, specific dates, handover explanation, and polite closing.',
    systemPromptHi: 'एक प्रामाणिक, सम्मानजनक और औपचारिक हिंदी अवकाश प्रार्थना पत्र तैयार करें जिसमें स्पष्ट विषय, कारण, दिनांक और भवदीय हस्ताक्षर शामिल हों।',
  },

  // 2. Scholarship Application Letter
  {
    id: 'scholarship_application',
    name: 'Scholarship Application Letter',
    nameHi: 'छात्रवृत्ति हेतु आवेदन पत्र',
    category: 'scholarship',
    description: 'Comprehensive financial assistance request to welfare department or institutional scholarship committee.',
    descriptionHi: 'समाज कल्याण विभाग अथवा संस्थागत छात्रवृत्ति समिति को वित्तीय सहायता हेतु औपचारिक आवेदन।',
    minLengthChars: 500,
    requiredSections: ['header', 'date', 'subject', 'salutation', 'body', 'closing', 'signature', 'enclosures'],
    requiredDocuments: [
      {
        id: 'photo',
        name: 'Passport Size Photograph',
        nameHi: 'पासपोर्ट साइज फोटो',
        type: 'photo',
        required: true,
        allowedFormats: ['jpg', 'jpeg', 'png'],
        maxSizeBytes: 200 * 1024, // 200 KB
        description: 'Recent clear color photograph (max 200 KB, JPG/PNG).',
        descriptionHi: 'हाल ही में खींची गई स्पष्ट रंगीन फोटो (अधिकतम 200 KB, JPG/PNG)।',
      },
      {
        id: 'signature',
        name: 'Applicant Signature',
        nameHi: 'आवेदक के हस्ताक्षर',
        type: 'signature',
        required: true,
        allowedFormats: ['jpg', 'jpeg', 'png'],
        maxSizeBytes: 100 * 1024, // 100 KB
        description: 'Clear digital signature on white paper (max 100 KB).',
        descriptionHi: 'सफेद कागज पर स्पष्ट हस्ताक्षर की स्कैन कॉपी (अधिकतम 100 KB)।',
      },
      {
        id: 'aadhaar',
        name: 'Aadhaar Card Copy',
        nameHi: 'आधार कार्ड प्रति',
        type: 'aadhaar',
        required: true,
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeBytes: 2 * 1024 * 1024, // 2 MB
        description: 'Self-attested Aadhaar card for demographic verification (max 2 MB).',
        descriptionHi: 'पहचान एवं पते के प्रमाण हेतु आधार कार्ड की प्रति (अधिकतम 2 MB)।',
      },
      {
        id: 'marksheet',
        name: 'Previous Academic Marksheet',
        nameHi: 'पूर्व शैक्षणिक अंकसूची',
        type: 'marksheet',
        required: true,
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeBytes: 2 * 1024 * 1024, // 2 MB
        description: 'Last qualifying examination marksheet or grade transcript (max 2 MB).',
        descriptionHi: 'अंतिम उत्तीर्ण परीक्षा की प्रमाणित अंकसूची (अधिकतम 2 MB)।',
      },
      {
        id: 'income_certificate',
        name: 'Income Certificate',
        nameHi: 'आय प्रमाण पत्र',
        type: 'income_certificate',
        required: true,
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeBytes: 2 * 1024 * 1024, // 2 MB
        description: 'Valid revenue authority income certificate of current financial year (max 2 MB).',
        descriptionHi: 'सक्षम राजस्व अधिकारी द्वारा जारी वैध आय प्रमाण पत्र (अधिकतम 2 MB)।',
      },
      {
        id: 'caste_certificate',
        name: 'Caste Certificate (if applicable)',
        nameHi: 'जाति प्रमाण पत्र (यदि लागू हो)',
        type: 'caste_certificate',
        required: false,
        allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeBytes: 2 * 1024 * 1024, // 2 MB
        description: 'SC/ST/OBC category certificate issued by competent authority (max 2 MB).',
        descriptionHi: 'आरक्षित वर्ग (SC/ST/OBC/EWS) के आवेदकों हेतु जाति प्रमाण पत्र।',
      },
    ],
    fields: [
      { key: 'applicant_name', label: 'Student Full Name', labelHi: 'छात्र का पूरा नाम', type: 'text', required: true, profileKey: 'full_name', placeholder: 'e.g. Priya Patel', placeholderHi: 'उदा. प्रिया पटेल' },
      { key: 'father_name', label: 'Father / Guardian Name', labelHi: 'पिता / अभिभावक का नाम', type: 'text', required: true, profileKey: 'father_name', placeholder: 'e.g. Ramesh Patel', placeholderHi: 'उदा. रमेश पटेल' },
      { key: 'mother_name', label: 'Mother Name', labelHi: 'माता का नाम', type: 'text', required: true, profileKey: 'mother_name', placeholder: 'e.g. Sunita Patel', placeholderHi: 'उदा. सुनीता पटेल' },
      { key: 'dob', label: 'Date of Birth', labelHi: 'जन्म तिथि', type: 'date', required: true, profileKey: 'dob', placeholder: 'YYYY-MM-DD', placeholderHi: 'YYYY-MM-DD' },
      { key: 'email', label: 'Email Address', labelHi: 'ईमेल पता', type: 'email', required: true, profileKey: 'email', placeholder: 'priya.patel@example.com', placeholderHi: 'priya.patel@example.com' },
      { key: 'mobile', label: 'Mobile Number', labelHi: 'मोबाइल नंबर', type: 'tel', required: true, profileKey: 'phone', placeholder: '9876543210', placeholderHi: '9876543210' },
      { key: 'address', label: 'Residential Address', labelHi: 'निवास का पता', type: 'textarea', required: true, profileKey: 'address', placeholder: 'Complete address with Pincode', placeholderHi: 'पिनकोड सहित पूर्ण पता' },
      { key: 'category_caste', label: 'Category / Caste', labelHi: 'वर्ग / जाति', type: 'text', required: true, profileKey: 'category', placeholder: 'e.g. OBC / SC / ST / EWS', placeholderHi: 'उदा. अन्य पिछड़ा वर्ग (OBC) / SC / ST / EWS' },
      { key: 'institution_name', label: 'College / University Name', labelHi: 'कॉलेज / विश्वविद्यालय का नाम', type: 'text', required: true, placeholder: 'e.g. Govt. Polytechnic College, Indore', placeholderHi: 'उदा. शासकीय पॉलिटेक्निक कॉलेज, इंदौर' },
      { key: 'course_and_year', label: 'Course, Stream & Current Year', labelHi: 'पाठ्यक्रम, संकाय व वर्तमान वर्ष', type: 'text', required: true, placeholder: 'e.g. Diploma in Electrical Engg, 2nd Year', placeholderHi: 'उदा. इलेक्ट्रिकल इंजीनियरिंग डिप्लोमा, द्वितीय वर्ष' },
      { key: 'annual_income', label: 'Annual Family Income', labelHi: 'वार्षिक पारिवारिक आय', type: 'text', required: true, placeholder: 'e.g. Rs. 1,40,000/- per annum', placeholderHi: 'उदा. रु. 1,40,000/- प्रति वर्ष' },
      { key: 'academic_record', label: 'Previous Academic Performance (Marks / %)', labelHi: 'पूर्व शैक्षणिक परिणाम (अंक / %)', type: 'text', required: true, placeholder: 'e.g. 84.5% in 12th Board Examinations', placeholderHi: 'उदा. 12वीं बोर्ड में 84.5% अंक' },
      { key: 'recipient_title', label: 'Sanctioning Authority / Designation', labelHi: 'स्वीकृतिकर्ता प्राधिकारी / पद', type: 'text', required: true, placeholder: 'e.g. The District Welfare Officer', placeholderHi: 'उदा. जिला समाज कल्याण अधिकारी' },
      { key: 'department_or_office', label: 'Department / Office Name', labelHi: 'विभाग / कार्यालय का नाम', type: 'text', required: true, placeholder: 'e.g. Backward Classes & Minorities Welfare Department', placeholderHi: 'उदा. पिछड़ा वर्ग एवं अल्पसंख्यक कल्याण विभाग' },
      { key: 'scheme_name', label: 'Scholarship Scheme Name', labelHi: 'छात्रवृत्ति योजना का नाम', type: 'text', required: true, placeholder: 'e.g. Post-Matric State Scholarship Scheme 2026-27', placeholderHi: 'उदा. पोस्ट-मैट्रिक राज्य छात्रवृत्ति योजना' },
    ],
    systemPromptEn: 'Draft an authentic Indian government/institutional scholarship application letter highlighting economic eligibility, academic diligence, family circumstances, and complete enclosures list.',
    systemPromptHi: 'आर्थिक स्थिति, शैक्षणिक योग्यता और संलग्नक सूची के साथ संपूर्ण औपचारिक छात्रवृत्ति प्रार्थना पत्र तैयार करें।',
  },

  // 3. Formal Resignation Letter
  {
    id: 'resignation',
    name: 'Formal Resignation Letter',
    nameHi: 'त्यागपत्र / इस्तीफा पत्र',
    category: 'employment',
    description: 'Formal employee resignation letter to reporting manager or HR head with notice period and handover transition.',
    descriptionHi: 'प्रबंधक अथवा मानव संसाधन विभाग को नोटिस अवधि एवं दायित्व हस्तांतरण सहित औपचारिक त्यागपत्र।',
    minLengthChars: 450,
    requiredSections: ['header', 'date', 'subject', 'salutation', 'body', 'closing', 'signature'],
    requiredDocuments: [],
    fields: [
      { key: 'applicant_name', label: 'Employee Full Name', labelHi: 'कर्मचारी का पूरा नाम', type: 'text', required: true, profileKey: 'full_name', placeholder: 'e.g. Rahul Sharma', placeholderHi: 'उदा. राहुल शर्मा' },
      { key: 'employee_id', label: 'Employee ID / Staff Code', labelHi: 'कर्मचारी कोड / स्टाफ आईडी', type: 'text', required: true, placeholder: 'e.g. EMP-40918', placeholderHi: 'उदा. EMP-40918' },
      { key: 'designation', label: 'Designation / Current Role', labelHi: 'वर्तमान पद / पदनाम', type: 'text', required: true, placeholder: 'e.g. Senior Software Engineer', placeholderHi: 'उदा. वरिष्ठ सॉफ्टवेयर इंजीनियर' },
      { key: 'department', label: 'Department / Team', labelHi: 'विभाग / प्रभाग', type: 'text', required: true, placeholder: 'e.g. Information Technology / Product Engg', placeholderHi: 'उदा. सूचना प्रौद्योगिकी / इंजीनियरिंग' },
      { key: 'organization_name', label: 'Company / Organization Name', labelHi: 'संस्था / कंपनी का नाम', type: 'text', required: true, placeholder: 'e.g. TechCorp Solutions Pvt. Ltd.', placeholderHi: 'उदा. टेककॉर्प सोल्यूशंस प्रा. लि.' },
      { key: 'recipient_title', label: 'Reporting Manager / HR Head Title', labelHi: 'रिपोर्टिंग मैनेजर / मानव संसाधन प्रमुख', type: 'text', required: true, placeholder: 'e.g. The Engineering Director / Head of HR', placeholderHi: 'उदा. श्रीमान इंजीनियरिंग डायरेक्टर / एचआर हेड' },
      { key: 'recipient_address', label: 'Office / City Location', labelHi: 'कार्यालय / शहर का स्थान', type: 'text', required: true, placeholder: 'e.g. Cyber City, Gurugram, Haryana', placeholderHi: 'उदा. साइबर सिटी, गुरुग्राम, हरियाणा' },
      { key: 'notice_period', label: 'Notice Period', labelHi: 'नोटिस अवधि', type: 'select', required: true, options: ['30 Days', '60 Days', '90 Days', 'Immediate (Notice Buyout)'], placeholder: 'Select notice period', placeholderHi: 'नोटिस अवधि चुनें' },
      { key: 'last_working_day', label: 'Proposed Last Working Date', labelHi: 'प्रस्तावित अंतिम कार्य दिवस', type: 'date', required: true, placeholder: 'YYYY-MM-DD', placeholderHi: 'YYYY-MM-DD' },
      { key: 'reason', label: 'Reason for Resignation', labelHi: 'त्यागपत्र का कारण', type: 'textarea', required: true, placeholder: 'Detail reason for resignation (career growth, higher studies, personal commitments)...', placeholderHi: 'त्यागपत्र का कारण (करियर विकास, उच्च शिक्षा, व्यक्तिगत कारण, आदि)...' },
      { key: 'emergency_phone', label: 'Personal Mobile / Contact', labelHi: 'व्यक्तिगत मोबाइल नंबर', type: 'tel', required: false, profileKey: 'phone', placeholder: '+91 98765 43210', placeholderHi: '+91 98765 43210' },
    ],
    systemPromptEn: 'Draft an authentic, courteous, and professional Indian formal resignation letter detailing gratitude for tenure, notice period timeline, last working date, thorough handover commitment, and polite closing.',
    systemPromptHi: 'एक प्रामाणिक, गरिमापूर्ण और औपचारिक हिंदी त्यागपत्र तैयार करें जिसमें कार्यकाल के प्रति कृतज्ञता, नोटिस अवधि, अंतिम कार्य दिवस और दायित्वों के सुचारू हस्तांतरण का विस्तृत विवरण हो।',
  },

  // 3. Complaint & Public Grievance Letter
  {
    id: 'complaint_letter',
    name: 'Formal Complaint & Grievance Letter',
    nameHi: 'औपचारिक शिकायत एवं समस्या निवारण पत्र',
    category: 'complaint',
    description: 'Official complaint to municipal corporation, police commissioner, consumer forum, or utility board.',
    descriptionHi: 'नगर निगम, पुलिस प्रशासन, उपभोक्ता फोरम या विद्युत विभाग को आधिकारिक शिकायत पत्र।',
    minLengthChars: 500,
    requiredSections: ['header', 'date', 'subject', 'salutation', 'body', 'closing', 'signature', 'enclosures'],
    requiredDocuments: [
      { id: 'doc_comp_photo', name: 'Photographs of Grievance Site / Issue', nameHi: 'समस्या स्थल के फोटो', type: 'photo', required: false, allowedFormats: ['jpg', 'jpeg', 'png'], maxSizeBytes: 2 * 1024 * 1024 },
      { id: 'doc_comp_id', name: 'Complainant ID Proof', nameHi: 'पहचान प्रमाण', type: 'aadhaar', required: false, allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'], maxSizeBytes: 2 * 1024 * 1024 },
    ],
    fields: [
      { key: 'applicant_name', label: 'Complainant Full Name', labelHi: 'शिकायतकर्ता का नाम', type: 'text', required: true, profileKey: 'full_name', placeholder: 'e.g. Amit Verma', placeholderHi: 'उदा. अमित वर्मा' },
      { key: 'applicant_address', label: 'Residential Address', labelHi: 'निवास का पता', type: 'textarea', required: true, profileKey: 'address', placeholder: 'House number, street, locality, city, pincode', placeholderHi: 'मकान नं., वार्ड, मोहल्ला, शहर व पिनकोड' },
      { key: 'recipient_title', label: 'Authority Designation', labelHi: 'प्राधिकारी का पद', type: 'text', required: true, placeholder: 'e.g. The Municipal Commissioner / Assistant Engineer', placeholderHi: 'उदा. नगर निगम आयुक्त / कार्यपालन यंत्री' },
      { key: 'authority_name', label: 'Department / Board Name', labelHi: 'विभाग / बोर्ड का नाम', type: 'text', required: true, placeholder: 'e.g. Municipal Corporation / State Power Distribution Co.', placeholderHi: 'उदा. नगर पालिक निगम / मध्य प्रदेश विद्युत वितरण कंपनी' },
      { key: 'incident_date', label: 'Date of Issue / Incident', labelHi: 'समस्या की तिथि / अवधि', type: 'text', required: true, placeholder: 'e.g. Since 15 October 2026', placeholderHi: 'उदा. पिछले 15 दिनों से लगातार' },
      { key: 'complaint_subject', label: 'Core Issue Subject', labelHi: 'शिकायत का मुख्य विषय', type: 'text', required: true, placeholder: 'e.g. Irregular drinking water supply and contaminated pipeline', placeholderHi: 'उदा. वार्ड में दूषित पेयजल आपूर्ति एवं पाइपलाइन लीकेज के संबंध में' },
      { key: 'complaint_details', label: 'Detailed Description of Problem', labelHi: 'समस्या का विस्तृत विवरण', type: 'textarea', required: true, placeholder: 'Explain specific difficulties faced, previous verbal complaints, and consequences...', placeholderHi: 'समस्या का विवरण, क्षेत्रवासियों को हो रही असुविधा और पूर्व में की गई शिकायतों का ब्यौरा...' },
      { key: 'relief_sought', label: 'Immediate Action / Relief Demanded', labelHi: 'अपेक्षित त्वरित कार्यवाही', type: 'textarea', required: true, placeholder: 'e.g. Immediate inspection by junior engineer, repair of pipeline, and supply restoration', placeholderHi: 'उदा. संबंधित अधिकारी द्वारा स्थल निरीक्षण, पाइपलाइन मरम्मत व शुद्ध पेयजल आपूर्ति' },
    ],
    systemPromptEn: 'Draft a firm, formal, well-structured Indian administrative complaint letter stating exact facts, public hardship, statutory duty of authority, and specific relief demanded.',
    systemPromptHi: 'नागरिक अधिकार, सार्वजनिक समस्या और तत्काल समाधान की मांग करते हुए एक सशक्त, वैधानिक और औपचारिक शिकायत पत्र तैयार करें।',
  },

  // 4. RTI Application (Right to Information)
  {
    id: 'rti_application',
    name: 'RTI Application Letter (Section 6(1))',
    nameHi: 'सूचना का अधिकार (RTI) आवेदन पत्र',
    category: 'rti',
    description: 'Statutory application seeking official certified records, file notings, or inspection under RTI Act 2005.',
    descriptionHi: 'सूचना का अधिकार अधिनियम 2005 की धारा 6(1) के अंतर्गत प्रमाणित अभिलेख व जानकारी प्राप्ति हेतु आवेदन।',
    minLengthChars: 500,
    requiredSections: ['header', 'date', 'subject', 'salutation', 'body', 'closing', 'signature', 'enclosures'],
    requiredDocuments: [
      { id: 'doc_rti_ipo', name: 'IPO / Fee Receipt', nameHi: 'पोस्टल ऑर्डर / शुल्क रसीद', type: 'fee_receipt', required: true, allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'], maxSizeBytes: 2 * 1024 * 1024 },
      { id: 'doc_rti_id', name: 'Citizen Identity Proof', nameHi: 'नागरिक पहचान पत्र', type: 'aadhaar', required: false, allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'], maxSizeBytes: 2 * 1024 * 1024 },
    ],
    fields: [
      { key: 'applicant_name', label: 'Applicant Name', labelHi: 'आवेदक का नाम', type: 'text', required: true, profileKey: 'full_name', placeholder: 'e.g. Rajesh Kumar', placeholderHi: 'उदा. राजेश कुमार' },
      { key: 'applicant_address', label: 'Applicant Postal Address', labelHi: 'आवेदक का डाक पता', type: 'textarea', required: true, profileKey: 'address', placeholder: 'Complete address for postal delivery of info', placeholderHi: 'पिनकोड सहित डाक प्राप्त करने का पूरा पता' },
      { key: 'pio_designation', label: 'Public Information Officer (PIO) Title', labelHi: 'जन सूचना अधिकारी का पद', type: 'text', required: true, placeholder: 'The Central / State Public Information Officer (CPIO / SPIO)', placeholderHi: 'श्रीमान लोक सूचना अधिकारी (PIO)' },
      { key: 'public_authority', label: 'Public Authority / Department', labelHi: 'सार्वजनिक प्राधिकरण / विभाग', type: 'text', required: true, placeholder: 'e.g. Public Works Department / District Collectorate', placeholderHi: 'उदा. लोक निर्माण विभाग (PWD) / कलेक्ट्रेट कार्यालय' },
      { key: 'office_address', label: 'Office Location / City', labelHi: 'कार्यालय का स्थान / शहर', type: 'text', required: true, placeholder: 'e.g. Vallabh Bhawan, Bhopal, M.P.', placeholderHi: 'उदा. मंत्रालय, वल्लभ भवन, भोपाल' },
      { key: 'particulars_of_information', label: 'Specific Information Requested', labelHi: 'वांछित सूचना का बिंदुवार विवरण', type: 'textarea', required: true, placeholder: '1. Certified copy of tender document... 2. Work completion certificate and payment receipts...', placeholderHi: '1. स्वीकृत कार्य की प्रमाणित प्रतिलिपि... 2. भुगतान वाउचर व कार्य पूर्णता प्रमाण पत्र...' },
      { key: 'period_pertaining_to', label: 'Period Pertaining to Information', labelHi: 'सूचना से संबंधित समयावधि', type: 'text', required: true, placeholder: 'e.g. 01 April 2024 to 31 March 2026', placeholderHi: 'उदा. 1 अप्रैल 2024 से 31 मार्च 2026 तक' },
      { key: 'fee_details', label: 'Application Fee Details', labelHi: 'आवेदन शुल्क का विवरण', type: 'text', required: true, placeholder: 'e.g. Indian Postal Order (IPO) No. 45G 123456 of Rs. 10/-', placeholderHi: 'उदा. रु. 10/- का भारतीय पोस्टल ऑर्डर (IPO) सं. 45G 123456 संलग्न' },
    ],
    systemPromptEn: 'Draft a legally compliant RTI application strictly adhering to Section 6(1) of Right to Information Act 2005 with clear itemized queries, citizenship declaration, and fee details.',
    systemPromptHi: 'सूचना का अधिकार अधिनियम 2005 की धारा 6(1) के कानूनी प्रावधानों के अनुरूप बिंदुवार जानकारी, भारतीय नागरिकता की घोषणा और शुल्क विवरण सहित औपचारिक आवेदन बनाएं।',
  },

  // 5. Income / Caste / Domicile Certificate Application
  {
    id: 'certificate_application',
    name: 'Certificate Application (Income / Caste / Domicile)',
    nameHi: 'प्रमाण पत्र हेतु आवेदन (आय / जाति / मूल निवास)',
    category: 'certificate',
    description: 'Official citizen application to Tehsildar or Sub-Divisional Officer (SDO) for issuance of revenue certificates.',
    descriptionHi: 'तहसीलदार अथवा अनुविभागीय अधिकारी (राजस्व) को आय, जाति अथवा मूल निवास प्रमाण पत्र जारी करने हेतु आवेदन।',
    minLengthChars: 480,
    requiredSections: ['header', 'date', 'subject', 'salutation', 'body', 'closing', 'signature', 'enclosures'],
    requiredDocuments: [
      { id: 'doc_cert_photo', name: 'Passport Size Photograph', nameHi: 'पासपोर्ट फोटो', type: 'photo', required: true, allowedFormats: ['jpg', 'jpeg', 'png'], maxSizeBytes: 200 * 1024 },
      { id: 'doc_cert_aadhaar', name: 'Aadhaar Card', nameHi: 'आधार कार्ड', type: 'aadhaar', required: true, allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'], maxSizeBytes: 2 * 1024 * 1024 },
      { id: 'doc_cert_income_proof', name: 'Ration Card / Salary Slip', nameHi: 'राशन कार्ड / वेतन पर्ची', type: 'income_certificate', required: false, allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'], maxSizeBytes: 2 * 1024 * 1024 },
    ],
    fields: [
      { key: 'applicant_name', label: 'Applicant Legal Name', labelHi: 'आवेदक का पूरा नाम', type: 'text', required: true, profileKey: 'full_name', placeholder: 'e.g. Sandeep Lodhi', placeholderHi: 'उदा. संदीप लोधी' },
      { key: 'father_name', label: 'Father / Husband Name', labelHi: 'पिता / पति का नाम', type: 'text', required: true, profileKey: 'father_name', placeholder: 'e.g. Mohan Lodhi', placeholderHi: 'उदा. मोहन लोधी' },
      { key: 'applicant_address', label: 'Permanent Residence Address', labelHi: 'स्थाई निवास का पता', type: 'textarea', required: true, profileKey: 'address', placeholder: 'Village/Town, Tehsil, District, State & Pincode', placeholderHi: 'ग्राम/वार्ड, तहसील, जिला व राज्य' },
      { key: 'recipient_title', label: 'Revenue Authority Title', labelHi: 'राजस्व अधिकारी का पद', type: 'text', required: true, placeholder: 'e.g. The Tehsildar / Sub-Divisional Magistrate (SDM)', placeholderHi: 'उदा. श्रीमान तहसीलदार महोदय / अनुविभागीय अधिकारी (राजस्व)' },
      { key: 'tehsil_district', label: 'Tehsil & District Name', labelHi: 'तहसील व जिले का नाम', type: 'text', required: true, placeholder: 'e.g. Tehsil Huzur, District Bhopal, M.P.', placeholderHi: 'उदा. तहसील हुजूर, जिला भोपाल (म.प्र.)' },
      { key: 'certificate_type', label: 'Certificate Required', labelHi: 'वांछित प्रमाण पत्र', type: 'select', required: true, options: ['Income Certificate (आय प्रमाण पत्र)', 'Caste Certificate (जाति प्रमाण पत्र)', 'Domicile / Residence Certificate (मूल निवास प्रमाण पत्र)', 'Economically Weaker Section (EWS) Certificate'], placeholder: 'Select certificate type', placeholderHi: 'प्रमाण पत्र का प्रकार चुनें' },
      { key: 'purpose', label: 'Purpose of Certificate', labelHi: 'प्रमाण पत्र का प्रयोजन', type: 'text', required: true, placeholder: 'e.g. Higher Education Admission / Govt. Scholarship / Employment', placeholderHi: 'उदा. उच्च शिक्षा प्रवेश एवं सरकारी छात्रवृत्ति हेतु' },
      { key: 'annual_income', label: 'Declared Annual Income (for Income Cert)', labelHi: 'घोषित वार्षिक आय (आय प्रमाण पत्र हेतु)', type: 'text', required: false, placeholder: 'e.g. Rs. 1,20,000/- from agriculture & manual labor', placeholderHi: 'उदा. रु. 1,20,000/- (कृषि व मजदूरी से)' },
      { key: 'caste_subcaste', label: 'Caste & Sub-Caste (for Caste Cert)', labelHi: 'जाति व उप-जाति (जाति प्रमाण पत्र हेतु)', type: 'text', required: false, placeholder: 'e.g. Lodhi (OBC Category, Sr. No. 48)', placeholderHi: 'उदा. लोधी (अन्य पिछड़ा वर्ग, सरल क्र. 48)' },
    ],
    systemPromptEn: 'Draft a standard revenue administration application for state revenue certificate including verification statement, declaration of truthfulness, and statutory enclosure proofs.',
    systemPromptHi: 'राजस्व संहिता के अनुरूप तहसीलदार को प्रस्तुत करने योग्य प्रमाण पत्र आवेदन पत्र बनाएं जिसमें सत्यनिष्ठा की घोषणा और सभी आवश्यक प्रमाण संलग्न हों।',
  },

  // 6. Bank KYC Update Letter
  {
    id: 'bank_kyc_letter',
    name: 'Bank KYC Update & Reactivation Letter',
    nameHi: 'बैंक केवाईसी अद्यतन एवं खाता सत्यापन पत्र',
    category: 'banking',
    description: 'Formal request to bank branch manager for periodic KYC update, address change, or account unfreezing.',
    descriptionHi: 'बैंक शाखा प्रबंधक को आवधिक केवाईसी अद्यतन, पता संशोधन अथवा खाता सक्रियण हेतु आवेदन।',
    minLengthChars: 450,
    requiredSections: ['header', 'date', 'subject', 'salutation', 'body', 'closing', 'signature', 'enclosures'],
    requiredDocuments: [
      { id: 'doc_kyc_photo', name: 'Passport Size Photograph', nameHi: 'पासपोर्ट फोटो', type: 'photo', required: true, allowedFormats: ['jpg', 'jpeg', 'png'], maxSizeBytes: 200 * 1024 },
      { id: 'doc_kyc_pan', name: 'PAN Card Copy', nameHi: 'पैन कार्ड प्रति', type: 'pan', required: true, allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'], maxSizeBytes: 2 * 1024 * 1024 },
      { id: 'doc_kyc_aadhaar', name: 'Aadhaar Card / Address Proof', nameHi: 'आधार कार्ड / पते का प्रमाण', type: 'aadhaar', required: true, allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'], maxSizeBytes: 2 * 1024 * 1024 },
    ],
    fields: [
      { key: 'account_holder_name', label: 'Account Holder Full Name', labelHi: 'खाताधारक का पूरा नाम', type: 'text', required: true, profileKey: 'full_name', placeholder: 'e.g. Manoj Joshi', placeholderHi: 'उदा. मनोज जोशी' },
      { key: 'account_number', label: 'Bank Account Number', labelHi: 'बैंक खाता संख्या', type: 'text', required: true, placeholder: 'e.g. 10293847561', placeholderHi: 'उदा. 10293847561' },
      { key: 'bank_name', label: 'Bank Name', labelHi: 'बैंक का नाम', type: 'text', required: true, placeholder: 'e.g. State Bank of India / Punjab National Bank', placeholderHi: 'उदा. भारतीय स्टेट बैंक (SBI)' },
      { key: 'branch_name', label: 'Branch Name & Location', labelHi: 'शाखा का नाम व स्थान', type: 'text', required: true, placeholder: 'e.g. TT Nagar Branch, Bhopal', placeholderHi: 'उदा. टी.टी. नगर शाखा, भोपाल' },
      { key: 'residential_address', label: 'Current Residential Address', labelHi: 'वर्तमान निवास का पता', type: 'textarea', required: true, profileKey: 'address', placeholder: 'Complete address with Pincode', placeholderHi: 'पिनकोड सहित पूर्ण पता' },
      { key: 'registered_phone', label: 'Registered Mobile Number', labelHi: 'पंजीकृत मोबाइल नंबर', type: 'tel', required: true, profileKey: 'phone', placeholder: '+91 98765 43210', placeholderHi: '+91 98765 43210' },
      { key: 'kyc_purpose', label: 'KYC Purpose', labelHi: 'केवाईसी का कारण', type: 'select', required: true, options: ['Periodic Re-KYC Compliance', 'Reactivation of Inoperative / Dormant Account', 'Address & Contact Details Updation', 'Removal of Debit Freeze'], placeholder: 'Select KYC purpose', placeholderHi: 'केवाईसी का कारण चुनें' },
    ],
    systemPromptEn: 'Draft an authentic banking correspondence to the Branch Manager for KYC update and account maintenance adhering to Reserve Bank of India (RBI) KYC master guidelines.',
    systemPromptHi: 'भारतीय रिज़र्व बैंक के केवाईसी दिशा-निर्देशों के अनुसार शाखा प्रबंधक को संबोधित औपचारिक बैंक केवाईसी अद्यतन पत्र तैयार करें।',
  },

  // 7. Job Application / Cover Letter
  {
    id: 'job_application',
    name: 'Job Application & Formal Cover Letter',
    nameHi: 'नौकरी हेतु आवेदन एवं कवर लेटर',
    category: 'employment',
    description: 'Professional employment application highlighting experience, educational background, and role alignment.',
    descriptionHi: 'अनुभव, शैक्षणिक योग्यता और पद की उपयुक्तता दर्शाते हुए व्यावसायिक नौकरी आवेदन पत्र।',
    minLengthChars: 480,
    requiredSections: ['header', 'date', 'subject', 'salutation', 'body', 'closing', 'signature', 'enclosures'],
    requiredDocuments: [
      { id: 'doc_job_photo', name: 'Passport Size Photograph', nameHi: 'पासपोर्ट फोटो', type: 'photo', required: true, allowedFormats: ['jpg', 'jpeg', 'png'], maxSizeBytes: 200 * 1024 },
      { id: 'doc_job_resume', name: 'Resume / Curriculum Vitae', nameHi: 'बायोडाटा / रिज्यूमे', type: 'resume', required: true, allowedFormats: ['pdf', 'docx'], maxSizeBytes: 2 * 1024 * 1024 },
      { id: 'doc_job_degree', name: 'Degree / Marksheet', nameHi: 'डिग्री / अंकसूची', type: 'marksheet', required: false, allowedFormats: ['pdf', 'jpg', 'png'], maxSizeBytes: 2 * 1024 * 1024 },
    ],
    fields: [
      { key: 'applicant_name', label: 'Applicant Name', labelHi: 'आवेदक का नाम', type: 'text', required: true, profileKey: 'full_name', placeholder: 'e.g. Sneha Roy', placeholderHi: 'उदा. स्नेहा रॉय' },
      { key: 'applicant_email', label: 'Email Address', labelHi: 'ईमेल पता', type: 'email', required: true, profileKey: 'email', placeholder: 'sneha.roy@example.com', placeholderHi: 'sneha.roy@example.com' },
      { key: 'applicant_phone', label: 'Mobile Number', labelHi: 'मोबाइल नंबर', type: 'tel', required: true, profileKey: 'phone', placeholder: '+91 98765 43210', placeholderHi: '+91 98765 43210' },
      { key: 'position_applied', label: 'Position / Post Applied For', labelHi: 'आवेदित पद का नाम', type: 'text', required: true, placeholder: 'e.g. Accounts Assistant / Operations Executive', placeholderHi: 'उदा. लेखा सहायक / ऑपरेशन्स एग्जीक्यूटिव' },
      { key: 'company_name', label: 'Company / Organization Name', labelHi: 'कंपनी / संस्था का नाम', type: 'text', required: true, placeholder: 'e.g. Tata Consultancy Services', placeholderHi: 'उदा. टाटा कंसल्टेंसी सर्विसेज' },
      { key: 'hiring_manager_title', label: 'Hiring Authority Designation', labelHi: 'नियुक्ति प्राधिकारी का पद', type: 'text', required: true, placeholder: 'e.g. The HR Manager / Recruitment Team', placeholderHi: 'उदा. मानव संसाधन प्रबंधक (HR Head)' },
      { key: 'qualification_summary', label: 'Key Qualifications & Experience', labelHi: 'मुख्य योग्यताएं एवं अनुभव', type: 'textarea', required: true, placeholder: 'Highlight degrees, relevant software skills, and years of experience...', placeholderHi: 'स्नातक/डिप्लोमा, प्रासंगिक कंप्यूटर कौशल व कार्य अनुभव का संक्षेप...' },
    ],
    systemPromptEn: 'Draft an Indian formal corporate or government job application letter presenting professional qualifications, enthusiasm, and career credentials persuasively.',
    systemPromptHi: 'शैक्षणिक योग्यता, तकनीकी दक्षता और निष्ठापूर्वक कार्य करने की प्रतिबद्धता दर्शाते हुए एक प्रभावशाली औपचारिक नौकरी आवेदन पत्र तैयार करें।',
  },

  // 8. General Administrative Application
  {
    id: 'general_application',
    name: 'General Official Application Letter',
    nameHi: 'सामान्य आधिकारिक आवेदन पत्र',
    category: 'general',
    description: 'All-purpose formal application for government offices, municipal bodies, universities, or public utilities.',
    descriptionHi: 'शासकीय कार्यालयों, नगर परिषदों, विश्वविद्यालयों अथवा संस्थानों हेतु सर्व-उद्देश्यीय औपचारिक आवेदन पत्र।',
    minLengthChars: 450,
    requiredSections: ['header', 'date', 'subject', 'salutation', 'body', 'closing', 'signature'],
    requiredDocuments: [
      { id: 'doc_gen_id', name: 'Identity Proof (Aadhaar / Voter ID)', nameHi: 'पहचान पत्र', type: 'aadhaar', required: false, allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'], maxSizeBytes: 2 * 1024 * 1024 },
    ],
    fields: [
      { key: 'applicant_name', label: 'Applicant Name', labelHi: 'आवेदक का नाम', type: 'text', required: true, profileKey: 'full_name', placeholder: 'Your full legal name', placeholderHi: 'आपका पूरा नाम' },
      { key: 'applicant_address', label: 'Address & Contact', labelHi: 'पता व संपर्क', type: 'textarea', required: true, profileKey: 'address', placeholder: 'Address and phone number', placeholderHi: 'निवास का पता और मोबाइल नंबर' },
      { key: 'recipient_title', label: 'Recipient Authority Title', labelHi: 'प्राप्तकर्ता का पद', type: 'text', required: true, placeholder: 'e.g. The Officer-in-Charge / The Director', placeholderHi: 'उदा. सक्षम अधिकारी / निदेशक महोदय' },
      { key: 'office_name', label: 'Office / Department Name', labelHi: 'कार्यालय / विभाग का नाम', type: 'text', required: true, placeholder: 'e.g. District Administrative Complex', placeholderHi: 'उदा. जिला प्रशासनिक परिसर' },
      { key: 'subject_line', label: 'Subject Line', labelHi: 'पत्र का विषय', type: 'text', required: true, placeholder: 'e.g. Application regarding issuance of official record', placeholderHi: 'उदा. आवश्यक अभिलेख जारी करने के संबंध में' },
      { key: 'application_body', label: 'Main Request Statement', labelHi: 'आवेदन का मुख्य विवरण', type: 'textarea', required: true, placeholder: 'Detail your background, the official requirement, and formal request...', placeholderHi: 'आवश्यकता, पृष्ठभूमि और औपचारिक निवेदन का संपूर्ण विवरण...' },
    ],
    systemPromptEn: 'Draft an authentic, respectful Indian administrative application letter adhering to standard government petition formats.',
    systemPromptHi: 'मानक प्रशासनिक प्रारूप के अनुसार सम्मानजनक, स्पष्ट और प्रभावी हिंदी आधिकारिक आवेदन पत्र तैयार करें।',
  },
];

// Helper: Match template by free-text prompt or ID
export function matchTemplateFromPrompt(prompt: string): FormTemplate {
  const p = (prompt || '').trim().toLowerCase();

  if (p === 'leave' || p.includes('leave') || p.includes('sick') || p.includes('casual') || p.includes('छुट्टी') || p.includes('अवकाश')) {
    return FORM_TEMPLATES.find(t => t.id === 'leave_application')!;
  }
  if (p === 'resignation' || p.includes('resignation') || p.includes('त्यागपत्र') || p.includes('इस्तीफा') || p.includes('resign')) {
    return FORM_TEMPLATES.find(t => t.id === 'resignation')!;
  }
  if (p.includes('scholarship') || p.includes('stipend') || p.includes('छात्रवृत्ति') || p.includes('शिष्यवृत्ति')) {
    return FORM_TEMPLATES.find(t => t.id === 'scholarship_application')!;
  }
  if (p.includes('complaint') || p.includes('grievance') || p.includes('शिकायत') || p.includes('समस्या')) {
    return FORM_TEMPLATES.find(t => t.id === 'complaint_letter')!;
  }
  if (p.includes('rti') || p.includes('right to information') || p.includes('सूचना का अधिकार') || p.includes('आरतीआई')) {
    return FORM_TEMPLATES.find(t => t.id === 'rti_application')!;
  }
  if (p.includes('certificate') || p.includes('income') || p.includes('caste') || p.includes('domicile') || p.includes('जाति') || p.includes('आय') || p.includes('निवास')) {
    return FORM_TEMPLATES.find(t => t.id === 'certificate_application')!;
  }
  if (p.includes('kyc') || p.includes('bank') || p.includes('account') || p.includes('बैंक') || p.includes('खाता')) {
    return FORM_TEMPLATES.find(t => t.id === 'bank_kyc_letter')!;
  }
  if (p.includes('job') || p.includes('employment') || p.includes('cover letter') || p.includes('नौकरी') || p.includes('भर्ती')) {
    return FORM_TEMPLATES.find(t => t.id === 'job_application')!;
  }

  // Exact ID check
  const byId = FORM_TEMPLATES.find(t => t.id === prompt);
  if (byId) return byId;

  // Default to general application
  return FORM_TEMPLATES.find(t => t.id === 'general_application')!;
}

// Dynamically create tailored template schema from user requirement
export function createCustomTemplateFromPrompt(prompt: string, language: 'en' | 'hi' = 'en'): FormTemplate {
  const trimmed = (prompt || '').trim();
  const isHi = language === 'hi';
  const titleFormatted = trimmed
    ? trimmed.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : (isHi ? 'विशिष्ट आधिकारिक आवेदन प्रारूप' : 'Custom Official Document');

  const lower = trimmed.toLowerCase();
  let category = 'general';
  if (lower.includes('rent') || lower.includes('lease') || lower.includes('contract') || lower.includes('business') || lower.includes('agreement') || lower.includes('किराया')) category = 'business';
  else if (lower.includes('police') || lower.includes('passport') || lower.includes('licence') || lower.includes('license') || lower.includes('pan') || lower.includes('aadhaar') || lower.includes('certificate') || lower.includes('government') || lower.includes('sarkari')) category = 'government';
  else if (lower.includes('school') || lower.includes('college') || lower.includes('scholarship') || lower.includes('exam') || lower.includes('student') || lower.includes('admission')) category = 'education';
  else if (lower.includes('medical') || lower.includes('health') || lower.includes('hospital') || lower.includes('doctor') || lower.includes('claim')) category = 'healthcare';
  else if (lower.includes('bank') || lower.includes('loan') || lower.includes('cheque') || lower.includes('card') || lower.includes('account')) category = 'banking';

  // Propose relevant documents for unknown custom template
  const proposedDocuments: TemplateDocument[] = [
    {
      id: 'doc_custom_id',
      name: 'Applicant Identity Proof (Aadhaar / Voter ID)',
      nameHi: 'पहचान का प्रमाण',
      type: 'aadhaar',
      required: true,
      allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
      maxSizeBytes: 2 * 1024 * 1024,
      description: 'Government photo identity card (max 2 MB).',
      descriptionHi: 'सरकारी पहचान पत्र (अधिकतम 2 MB)।',
    },
    {
      id: 'doc_custom_photo',
      name: 'Passport Size Photograph',
      nameHi: 'पासपोर्ट साइज फोटो',
      type: 'photo',
      required: false,
      allowedFormats: ['jpg', 'jpeg', 'png'],
      maxSizeBytes: 200 * 1024,
      description: 'Recent photograph if required (max 200 KB).',
      descriptionHi: 'पासपोर्ट फोटो (अधिकतम 200 KB)।',
    },
  ];

  return {
    id: `custom_${Date.now()}`,
    name: titleFormatted,
    nameHi: titleFormatted,
    category,
    isUnverified: true, // Marked as AI-proposed unverified template
    description: `Custom-tailored official document and formal layout for ${trimmed} (Unverified AI Template).`,
    descriptionHi: `${trimmed} हेतु विशिष्ट आधिकारिक दस्तावेज़ एवं प्रारूप (अपरीक्षित एआई प्रारूप)।`,
    minLengthChars: 220,
    requiredSections: ['header', 'date', 'subject', 'salutation', 'body', 'closing', 'signature', 'enclosures'],
    requiredDocuments: proposedDocuments,
    fields: [
      { key: 'applicant_name', label: 'Applicant / Principal Party Full Name', labelHi: 'आवेदक / मुख्य पक्ष का पूरा नाम', type: 'text', required: true, profileKey: 'full_name', placeholder: 'e.g. Rahul Sharma', placeholderHi: 'उदा. राहुल शर्मा' },
      { key: 'applicant_address', label: 'Address & Contact Information', labelHi: 'निवास का पता एवं संपर्क नंबर', type: 'textarea', required: true, profileKey: 'address', placeholder: 'Complete address with city and pincode', placeholderHi: 'शहर और पिनकोड सहित पूरा पता' },
      { key: 'recipient_title', label: 'Competent Authority / Recipient / Second Party', labelHi: 'सक्षम प्राधिकारी / प्राप्तकर्ता / द्वितीय पक्ष', type: 'text', required: true, placeholder: 'e.g. The Officer-in-Charge / Landlord Name', placeholderHi: 'उदा. सक्षम अधिकारी महोदय / मकान मालिक' },
      { key: 'specific_purpose', label: 'Primary Subject & Specific Requirement', labelHi: 'मुख्य विषय एवं विशिष्ट आवश्यकता', type: 'textarea', required: true, placeholder: `Detailed facts, requirements or terms regarding ${trimmed}...`, placeholderHi: `${trimmed} के संबंध में विस्तृत तथ्य व शर्तें...` },
      { key: 'reference_number', label: 'Reference / Application / Meter / ID Number (Optional)', labelHi: 'संदर्भ / आवेदन / मीटर / पहचान संख्या (वैकल्पिक)', type: 'text', required: false, placeholder: 'e.g. REF-2026-90412 or Consumer No.', placeholderHi: 'उदा. संदर्भ संख्या या उपभोक्ता क्रमांक' },
    ],
    systemPromptEn: `Draft a formal, comprehensive Indian legal, administrative, or commercial document specifically tailored for: "${trimmed}". Address the specific facts, statutory or customary rules, and explicit requirements.`,
    systemPromptHi: `"${trimmed}" के संबंध में एक प्रामाणिक, सम्मानजनक और संपूर्ण भारतीय आधिकारिक प्रारूप तैयार करें।`,
  };
}

export function getTemplateById(id: string): FormTemplate | undefined {
  return FORM_TEMPLATES.find(t => t.id === id);
}

export function getAllTemplates(): FormTemplate[] {
  return FORM_TEMPLATES;
}

// Convert DocumentSections to unified full text
export function formatSectionsToFullText(sections: DocumentSections, language = 'en'): string {
  const parts: string[] = [];

  if (sections.header) parts.push(sections.header.trim());
  if (sections.date) parts.push(sections.date.trim());
  if (sections.subject) parts.push(sections.subject.trim());
  if (sections.salutation) parts.push(sections.salutation.trim());
  if (sections.body) parts.push(sections.body.trim());
  if (sections.closing) parts.push(sections.closing.trim());
  if (sections.signature) parts.push(sections.signature.trim());

  if (sections.enclosures && sections.enclosures.length > 0) {
    const encTitle = language === 'hi' ? 'संलग्नक:' : 'Enclosures:';
    const encList = sections.enclosures.map((e, idx) => `${idx + 1}. ${e}`).join('\n');
    parts.push(`${encTitle}\n${encList}`);
  }

  return parts.join('\n\n');
}

// Validation function checking all required sections and minimum length
export function validateDocumentSections(
  sections: Partial<DocumentSections> | null | undefined,
  template: FormTemplate
): { valid: boolean; errors: string[]; charCount: number; wordCount: number } {
  const errors: string[] = [];

  if (!sections) {
    return { valid: false, errors: ['Document sections object is empty'], charCount: 0, wordCount: 0 };
  }

  // Check required sections
  for (const sec of template.requiredSections) {
    if (sec === 'enclosures') continue; // Enclosures validated separately if applicable
    const val = sections[sec];
    if (!val || typeof val !== 'string' || val.trim().length === 0) {
      errors.push(`Missing required section: "${sec}"`);
    }
  }

  // Check body length specifically — a formal letter body must have substantive substance
  if (!sections.body || sections.body.trim().length < 180) {
    errors.push(`Body content is too brief (${sections.body?.trim().length || 0} characters). Must contain complete paragraphs.`);
  }

  const fullText = formatSectionsToFullText(sections as DocumentSections);
  const charCount = fullText.length;
  const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;

  if (charCount < template.minLengthChars) {
    errors.push(
      `Document length is insufficient: ${charCount} characters found, minimum ${template.minLengthChars} required.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    charCount,
    wordCount,
  };
}

// Complete, rich, authentic fallback document generator for offline / fallback mode
export function generateFallbackDocument(
  template: FormTemplate,
  fieldValues: Record<string, string>,
  language: 'en' | 'hi' = 'en',
  customPrompt?: string
): DocumentSections {
  const isHi = language === 'hi';
  const today = new Date();
  const dateStr = isHi
    ? `${today.getDate()} ${['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'][today.getMonth()]} ${today.getFullYear()}`
    : today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const get = (k: string, defEn: string, defHi: string) => fieldValues[k] || (isHi ? defHi : defEn);

  switch (template.id) {
    case 'leave_application': {
      const applicant = get('applicant_name', 'Rahul Sharma', 'राहुल शर्मा');
      const designation = get('designation_or_roll', 'Senior Executive', 'वरिष्ठ अधिकारी');
      const org = get('organization_name', 'Acme Solutions Pvt. Ltd.', 'शासकीय महाविद्यालय');
      const recipient = get('recipient_title', 'The Branch Manager', 'श्रीमान शाखा प्रबंधक महोदय');
      const location = get('recipient_address', 'Bhopal, Madhya Pradesh', 'भोपाल, मध्य प्रदेश');
      const leaveType = get('leave_type', 'Casual Leave', 'आकस्मिक अवकाश');
      const startDate = get('start_date', '2026-11-01', '2026-11-01');
      const endDate = get('end_date', '2026-11-03', '2026-11-03');
      const reason = get('reason', 'due to urgent personal commitments and family responsibilities', 'अपरिहार्य पारिवारिक एवं व्यक्तिगत कार्य होने के कारण');
      const phone = get('emergency_phone', '+91 98765 43210', '+91 98765 43210');

      if (isHi) {
        return {
          header: `सेवा में,\n${recipient},\n${org},\n${location}`,
          date: `दिनांक: ${dateStr}`,
          subject: `विषय: ${startDate} से ${endDate} तक ${leaveType} स्वीकृत करने हेतु प्रार्थना पत्र`,
          salutation: `महोदय / महोदया,`,
          body: `सविनय निवेदन है कि प्रार्थी ${applicant}, आपकी प्रतिष्ठित संस्था में ${designation} के पद पर निष्ठापूर्वक कार्यरत है। प्रार्थी को उपरोक्त उल्लिखित अवधियों के दौरान ${reason} उपस्थित रहने में असमर्थता है।\n\nप्रार्थी ने अपनी अनुपस्थिति के दौरान कार्यालयीन कार्यों का सुचारू संचालन सुनिश्चित करने हेतु सभी आवश्यक दायित्व अपने सहयोगी को हस्तांतरित कर दिए हैं। किसी भी अत्यावश्यक कार्य हेतु प्रार्थी मोबाइल नंबर ${phone} पर उपलब्ध रहेगा।\n\nअतः आपसे सादर एवं विनम्र निवेदन है कि प्रार्थी को दिनांक ${startDate} से ${endDate} तक का ${leaveType} स्वीकृत करने की महती कृपा करें। इसके लिए प्रार्थी सदैव आपका आभारी रहेगा।`,
          closing: `सधन्यवाद,\nभवदीय,`,
          signature: `${applicant}\n${designation}\nसंपर्क: ${phone}`,
        };
      } else {
        return {
          header: `To,\n${recipient},\n${org},\n${location}`,
          date: `Date: ${dateStr}`,
          subject: `Subject: Application for ${leaveType} from ${startDate} to ${endDate}`,
          salutation: `Respected Sir/Madam,`,
          body: `I am writing to formally request ${leaveType} from ${startDate} to ${endDate} ${reason}.\n\nDuring my period of absence, I have ensured that all my ongoing assignments and urgent operational responsibilities are appropriately delegated to my team member so that workflow remains undisrupted. In case of any critical requirement or emergency, I will remain accessible via phone at ${phone} and email.\n\nI kindly request you to approve my leave application for the specified dates. I shall resume my duties promptly on the next working day. Thank you for your kind understanding and consideration.`,
          closing: `Yours faithfully / sincerely,`,
          signature: `${applicant}\n${designation}\nPhone: ${phone}`,
        };
      }
    }

    case 'scholarship_application': {
      const student = get('applicant_name', 'Priya Patel', 'प्रिया पटेल');
      const father = get('father_name', 'Ramesh Patel', 'रमेश पटेल');
      const recipient = get('recipient_title', 'The District Welfare Officer', 'जिला समाज कल्याण अधिकारी');
      const dept = get('department_or_office', 'Backward Classes & Minorities Welfare Department', 'पिछड़ा वर्ग एवं अल्पसंख्यक कल्याण विभाग');
      const scheme = get('scheme_name', 'State Post-Matric Scholarship Scheme 2026-27', 'राज्य पोस्ट-मैट्रिक छात्रवृत्ति योजना 2026-27');
      const institution = get('institution_name', 'Government Engineering College, Bhopal', 'शासकीय इंजीनियरिंग कॉलेज, भोपाल');
      const course = get('course_and_year', 'B.Tech in Computer Science, 2nd Year', 'बी.टेक (कंप्यूटर साइंस), द्वितीय वर्ष');
      const income = get('annual_income', 'Rs. 1,40,000/-', 'रु. 1,40,000/-');
      const category = get('category_caste', 'OBC Category', 'अन्य पिछड़ा वर्ग (OBC)');
      const records = get('academic_record', '86.4% in previous semester examinations', 'पूर्व सेमेस्टर परीक्षा में 86.4% अंक');

      if (isHi) {
        return {
          header: `सेवा में,\nश्रीमान ${recipient},\n${dept},\nजिला प्रशासनिक कार्यालय, भोपाल (म.प्र.)`,
          date: `दिनांक: ${dateStr}`,
          subject: `विषय: ${scheme} के अंतर्गत वित्तीय सहायता व छात्रवृत्ति स्वीकृति हेतु आवेदन पत्र`,
          salutation: `महोदय,`,
          body: `सविनय निवेदन है कि प्रार्थिया ${student}, आत्मजा श्री ${father}, ${institution} में ${course} की नियमित छात्रा है। प्रार्थिया ${category} से संबंधित है और परिवार की कुल वार्षिक आय सभी स्रोतों से मात्र ${income} है।\n\nप्रार्थिया ने अपनी पूर्व परीक्षाओं में निरंतर उत्कृष्ट प्रदर्शन करते हुए ${records} अर्जित किए हैं। कमजोर आर्थिक स्थिति के कारण उच्च तकनीकी शिक्षा का संस्थागत शिक्षण शुल्क एवं शैक्षणिक व्यय वहन करना परिवार के लिए अत्यधिक कठिन हो रहा है। प्रार्थिया राज्य सरकार द्वारा अधिसूचित ${scheme} के सभी पात्रता मानदंडों को पूर्ण करती है।\n\nअतः आपसे करबद्ध प्रार्थना है कि प्रार्थिया के आवेदन एवं संलग्न शैक्षणिक व आय प्रमाण पत्रों का समुचित सत्यापन कराकर चालू शैक्षणिक सत्र हेतु छात्रवृत्ति राशि स्वीकृत करने की महती कृपा करें। इस अनुकंपा के लिए प्रार्थिया सदैव आपकी आभारी रहेगी।`,
          closing: `सादर धन्यवाद,\nआपकी आज्ञाकारी शिष्या / प्रार्थिया,`,
          signature: `${student}\nअनुक्रमांक: 2024-CS-042\n${institution}`,
          enclosures: [
            '1. पूर्व वर्ष की अंकसूची की प्रमाणित प्रति (Marksheet copy)',
            '2. सक्षम राजस्व अधिकारी द्वारा जारी आय प्रमाण पत्र (Income Certificate)',
            '3. सक्षम प्राधिकारी द्वारा प्रदत्त जाति प्रमाण पत्र (Caste Certificate)',
            '4. संस्थागत शिक्षण शुल्क रसीद एवं बोनाफाइड प्रमाण पत्र (Fee Receipt & Bonafide)',
            '5. छात्र बैंक पासबुक एवं आधार कार्ड की छायाप्रति (Bank Passbook & Aadhaar Copy)',
          ],
        };
      } else {
        return {
          header: `To,\n${recipient},\n${dept},\nDistrict Collectorate Complex, Bhopal (M.P.)`,
          date: `Date: ${dateStr}`,
          subject: `Subject: Application for Grant of Financial Assistance under ${scheme}`,
          salutation: `Respected Sir/Madam,`,
          body: `I am submitting this formal application to kindly request sanction of scholarship under the ${scheme}. I am currently enrolled as a regular, full-time student pursuing ${course} at ${institution}.\n\nI belong to the ${category} category and my family's total annual income from all sources is ${income}, as certified by the competent revenue authority. Academically, I have maintained a consistent record of diligence, securing ${records}. Due to constrained financial means, it is challenging for my family to bear the semester tuition and academic development charges without state support.\n\nI fulfill all eligibility conditions stipulated under the scholarship guidelines and have enclosed all verified supporting documents herewith. I earnestly request you to favorably consider my application and grant the scholarship assistance for the current academic session.`,
          closing: `Yours faithfully,`,
          signature: `${student}\nRoll No: 2024-CS-042\n${institution}`,
          enclosures: [
            '1. Certified copies of past semester marksheets',
            '2. Valid Annual Income Certificate issued by Tehsildar',
            '3. Community / Caste Certificate issued by Sub-Divisional Officer',
            '4. Current Institutional Fee Receipt & Bonafide Certificate',
            '5. Copy of Bank Passbook (Aadhaar Seeded Account) & Identity Proof',
          ],
        };
      }
    }

    case 'resignation':
    case 'resignation_letter': {
      const applicant = get('applicant_name', 'Rahul Sharma', 'राहुल शर्मा');
      const empId = get('employee_id', 'EMP-40918', 'EMP-40918');
      const designation = get('designation', 'Senior Software Engineer', 'वरिष्ठ सॉफ्टवेयर इंजीनियर');
      const department = get('department', 'Information Technology', 'सूचना प्रौद्योगिकी विभाग');
      const org = get('organization_name', 'TechCorp Solutions Pvt. Ltd.', 'टेककॉर्प सोल्यूशंस प्रा. लि.');
      const recipient = get('recipient_title', 'The Engineering Director / Head of HR', 'श्रीमान इंजीनियरिंग डायरेक्टर / मानव संसाधन प्रमुख');
      const location = get('recipient_address', 'Cyber City, Gurugram, Haryana', 'साइबर सिटी, गुरुग्राम, हरियाणा');
      const noticePeriod = get('notice_period', '30 Days', '30 दिन');
      const lastWorkingDay = get('last_working_day', '2026-11-30', '2026-11-30');
      const reason = get('reason', 'to pursue new professional career development opportunities', 'नए करियर विकास एवं उच्च अवसरों की प्राप्ति हेतु');
      const phone = get('emergency_phone', '+91 98765 43210', '+91 98765 43210');

      if (isHi) {
        return {
          header: `सेवा में,\n${recipient},\n${org},\n${location}`,
          date: `दिनांक: ${dateStr}`,
          subject: `विषय: ${designation} के पद से औपचारिक त्यागपत्र बाबत`,
          salutation: `महोदय / महोदया,`,
          body: `सविनय निवेदन है कि मैं, ${applicant}, वर्तमान में आपकी प्रतिष्ठित संस्था ${org} के ${department} विभाग में ${designation} (कर्मचारी कोड: ${empId}) के पद पर सेवारत हूँ। ${reason}, मैं अपने वर्तमान पद से औपचारिक त्यागपत्र प्रस्तुत कर रहा हूँ।\n\nसंस्थान की सेवा शर्तों एवं अनुबंध के अनुसार मैं ${noticePeriod} की नोटिस अवधि पूर्ण करने हेतु प्रतिबद्ध हूँ। इस प्रकार संस्थान में मेरा प्रस्तावित अंतिम कार्य दिवस ${lastWorkingDay} होगा।\n\nमैं अपने कार्यकाल के दौरान प्रबंधन एवं अपनी टीम द्वारा दिए गए निरंतर मार्गदर्शन, सहयोग और सीखने के बेहतरीन अवसरों के लिए हृदय से आभार व्यक्त करता हूँ। इस नोटिस अवधि के दौरान मैं अपनी सभी चालू परियोजनाओं, दायित्वों एवं आवश्यक फाइलों का सुचारू रूप से पूर्ण हस्तांतरण (Handover) सुनिश्चित करूँगा ताकि कार्य में किसी भी प्रकार का व्यवधान न आए।\n\nकृपया मेरा त्यागपत्र स्वीकार करने एवं नियमानुसार कार्यमुक्ति व बकाया भुगतान की अग्रिम प्रक्रिया पूर्ण करने की कृपा करें। संस्थान के उज्ज्वल भविष्य एवं निरंतर प्रगति की मंगलकामनाओं सहित।`,
          closing: `सधन्यवाद,\nभवदीय,`,
          signature: `${applicant}\n${designation}\nकर्मचारी कोड: ${empId}\nसंपर्क: ${phone}`,
        };
      } else {
        return {
          header: `To,\n${recipient},\n${org},\n${location}`,
          date: `Date: ${dateStr}`,
          subject: `Subject: Formal Resignation from the position of ${designation} - ${applicant}`,
          salutation: `Respected Sir/Madam,`,
          body: `Please accept this letter as formal notification that I am resigning from my position as ${designation} (Employee ID: ${empId}) in the ${department} department at ${org}. ${reason}, I have decided to tender my resignation.\n\nIn accordance with the company employment policies, I will complete my required notice period of ${noticePeriod}. Therefore, my proposed last working day with the organization will be ${lastWorkingDay}.\n\nI wish to express my deepest gratitude for the professional opportunities, mentorship, and invaluable experience provided to me throughout my tenure at ${org}. Working alongside such dedicated colleagues has been a rewarding experience that has contributed immensely to my career.\n\nDuring this notice period, I am fully committed to ensuring a seamless, structured transition of all my active responsibilities, ongoing deliverables, and project documentation. I will also assist in knowledge transfer and onboarding support to ensure continuous operational excellence. Please let me know how I may further assist during this period.\n\nI wish ${org} and the entire team continued success and prosperity in all future endeavors.`,
          closing: `Yours sincerely,`,
          signature: `${applicant}\n${designation}\nEmployee ID: ${empId}\nPhone: ${phone}`,
        };
      }
    }

    case 'bank_kyc_letter': {
      const holder = get('account_holder_name', 'Manoj Joshi', 'मनोज जोशी');
      const accNo = get('account_number', '30192837465', '30192837465');
      const bank = get('bank_name', 'State Bank of India', 'भारतीय स्टेट बैंक');
      const branch = get('branch_name', 'TT Nagar Branch, Bhopal', 'टी.टी. नगर शाखा, भोपाल');
      const address = get('residential_address', '124, Shivaji Nagar, Bhopal, M.P. - 462016', '124, शिवाजी नगर, भोपाल (म.प्र.) - 462016');
      const phone = get('registered_phone', '+91 98765 43210', '+91 98765 43210');
      const purpose = get('kyc_purpose', 'Periodic Re-KYC Compliance and Account Maintenance', 'आवधिक पुन: केवाईसी अनुपालन एवं खाता सत्यापन');

      if (isHi) {
        return {
          header: `सेवा में,\nश्रीमान शाखा प्रबंधक महोदय,\n${bank},\n${branch}`,
          date: `दिनांक: ${dateStr}`,
          subject: `विषय: बचत खाता संख्या ${accNo} में केवाईसी (KYC) दस्तावेज़ अद्यतन करने बाबत`,
          salutation: `महोदय,`,
          body: `सविनय निवेदन है कि प्रार्थी ${holder} का एक बचत खाता आपकी शाखा में खाता संख्या ${accNo} के अंतर्गत संचालित है। प्रार्थी को भारतीय रिज़र्व बैंक के नियामक दिशानिर्देशों के तहत खाते में ${purpose} पूर्ण करने का निर्देश प्राप्त हुआ है।\n\nप्रार्थी अपने नवीनतम एवं प्रमाणित पहचान तथा निवास प्रमाण पत्र इस आवेदन के साथ संलग्न कर रहा है। प्रार्थी का वर्तमान स्थाई पता ${address} तथा पंजीकृत मोबाइल नंबर ${phone} है, जिसे बैंक के सीबीएस रिकॉर्ड में अद्यतन किया जाना आवश्यक है।\n\nअतः श्रीमान जी से विनम्र निवेदन है कि प्रार्थी द्वारा प्रस्तुत स्व-प्रमाणित केवाईसी दस्तावेज़ों को स्वीकार कर बैंक रिकॉर्ड में अद्यतन करने एवं खाते का निर्बाध संचालन सुनिश्चित करने की कृपा करें। इस सहयोग हेतु प्रार्थी आपका आभारी रहेगा।`,
          closing: `भवदीय,\nप्रार्थी,`,
          signature: `${holder}\nखाता संख्या: ${accNo}\nमोबाइल: ${phone}\nपता: ${address}`,
          enclosures: [
            '1. स्व-प्रमाणित आधार कार्ड की प्रति (Self-attested Aadhaar Card Copy)',
            '2. स्व-प्रमाणित पैन कार्ड की प्रति (Self-attested PAN Card Copy)',
            '3. नवीनतम पासपोर्ट आकार फोटोग्राफ (Recent Passport Photograph)',
          ],
        };
      } else {
        return {
          header: `To,\nThe Branch Manager,\n${bank},\n${branch}`,
          date: `Date: ${dateStr}`,
          subject: `Subject: Updation of KYC Documents for Savings Bank Account No. ${accNo}`,
          salutation: `Respected Sir/Madam,`,
          body: `I maintain an active Savings Bank Account with your esteemed branch under Account Number ${accNo}. I am submitting this formal communication for ${purpose} in accordance with Reserve Bank of India (RBI) customer due diligence norms.\n\nI have enclosed my self-attested identity proof (Aadhaar Card) and permanent account number (PAN Card) along with recent photographs. My verified residential address is ${address} and my active contact number is ${phone}. I request you to update these particulars in the core banking system.\n\nKindly acknowledge receipt of the enclosed documents and update my account status at your earliest convenience to facilitate unhindered banking transactions. Thank you for your continued support and assistance.`,
          closing: `Yours faithfully,`,
          signature: `${holder}\nA/c No: ${accNo}\nMobile: ${phone}\nAddress: ${address}`,
          enclosures: [
            '1. Self-attested copy of Aadhaar Card (Proof of Identity & Address)',
            '2. Self-attested copy of PAN Card',
            '3. Recent passport-sized color photograph',
          ],
        };
      }
    }

    case 'complaint_letter': {
      const complainant = get('applicant_name', 'Amit Verma', 'अमित वर्मा');
      const address = get('applicant_address', 'Flat 302, Green Valley Apartments, Ward 14, Bhopal (M.P.)', 'मकान नं. 45, वार्ड क्र. 14, ग्रीन वैली, भोपाल');
      const recipient = get('recipient_title', 'The Municipal Commissioner', 'श्रीमान आयुक्त महोदय');
      const authority = get('authority_name', 'Municipal Corporation, Bhopal', 'नगर पालिक निगम, भोपाल');
      const subject = get('complaint_subject', 'Irregular drinking water supply and contaminated pipeline leakages', 'वार्ड में निरंतर दूषित पेयजल आपूर्ति एवं पाइपलाइन लीकेज के संबंध में');
      const details = get('complaint_details', 'For the past three weeks, residents of our locality have been receiving muddy and foul-smelling water for barely 15 minutes a day, posing severe health hazards.', 'विगत तीन सप्ताह से क्षेत्र में पेयजल आपूर्ति अत्यंत अनियमित है। नलों से गंदा और बदबूदार पानी आ रहा है, जिससे नागरिकों में संक्रामक बीमारियों का गंभीर खतरा उत्पन्न हो गया है।');
      const relief = get('relief_sought', 'Immediate technical inspection by the public health engineering team and prompt repair of pipeline leakages to restore clean potable water.', 'जल कार्य विभाग द्वारा तत्काल स्थल निरीक्षण करवाकर पाइपलाइन की मरम्मत की जाए और स्वच्छ पेयजल आपूर्ति बहाल की जाए।');

      if (isHi) {
        return {
          header: `सेवा में,\n${recipient},\n${authority},\nमुख्यालय, भोपाल (म.प्र.)`,
          date: `दिनांक: ${dateStr}`,
          subject: `विषय: ${subject}`,
          salutation: `महोदय,`,
          body: `सविनय निवेदन है कि प्रार्थी ${complainant}, निवासी ${address}, आपके संज्ञान में क्षेत्र की गंभीर एवं चिंताजनक जनसमस्या प्रस्तुत कर रहा है।\n\n${details} इस विषय में स्थानीय वार्ड कार्यालय में पूर्व में भी मौखिक व लिखित सूचना दी गई थी, परंतु अब तक कोई ठोस सुधारात्मक कदम नहीं उठाया गया है। स्वच्छ पेयजल प्राप्त करना नागरिकों का मूलभूत अधिकार है तथा निगम प्रशासन का प्राथमिक वैधानिक दायित्व है।\n\nअतः श्रीमान जी से विनम्र निवेदन है कि जनहित को सर्वोपरि रखते हुए ${relief} इस त्वरित कार्यवाही हेतु प्रार्थी एवं समस्त क्षेत्रवासी सदैव आपके कृतज्ञ रहेंगे।`,
          closing: `सधन्यवाद,\nभवदीय / प्रार्थी,`,
          signature: `${complainant}\nपता: ${address}\nनागरिक प्रतिनिधि, वार्ड 14`,
        };
      } else {
        return {
          header: `To,\n${recipient},\n${authority},\nHead Office, Bhopal (M.P.)`,
          date: `Date: ${dateStr}`,
          subject: `Subject: Formal Complaint regarding ${subject}`,
          salutation: `Respected Sir/Madam,`,
          body: `I am writing on behalf of the residents of ${address} to bring to your urgent personal attention a critical civic grievance that has severely affected our neighborhood.\n\n${details} Despite repeated representations to the local ward maintenance division, no effective remedial measures have been initiated. The prolonged disruption in basic municipal services is causing immense distress to families, senior citizens, and young children.\n\nI earnestly urge your office to intervene immediately and direct the concerned engineering personnel to undertake ${relief} We look forward to your prompt and decisive administrative action.`,
          closing: `Yours sincerely,`,
          signature: `${complainant}\nAddress: ${address}\nOn behalf of Local Residents`,
        };
      }
    }

    case 'rti_application': {
      const applicant = get('applicant_name', 'Rajesh Kumar', 'राजेश कुमार');
      const address = get('applicant_address', 'House No. 56, Malviya Nagar, Bhopal, M.P. - 462003', 'मकान नं. 56, मालवीय नगर, भोपाल (म.प्र.) - 462003');
      const pio = get('pio_designation', 'The Public Information Officer (PIO)', 'श्रीमान लोक सूचना अधिकारी (PIO)');
      const authority = get('public_authority', 'Public Works Department (PWD)', 'लोक निर्माण विभाग (PWD)');
      const office = get('office_address', 'Nirman Bhawan, Arera Hills, Bhopal (M.P.)', 'निर्माण भवन, अरेरा हिल्स, भोपाल');
      const particulars = get('particulars_of_information', '1. Certified copy of tender sanction order for road construction in Sector B.\n2. Certified copy of completion certificate and quality inspection audit report.\n3. Details of total funds disbursed and name of contractor agency.', '1. सेक्टर-बी में सड़क निर्माण कार्य के स्वीकृत टेंडर आदेश की प्रमाणित प्रति।\n2. गुणवत्ता परीक्षण एवं कार्य पूर्णता प्रमाण पत्र (Quality Audit Report) की प्रतिलिपि।\n3. ठेकेदार फर्म का नाम व भुगतान की गई कुल राशि का विवरण।');
      const period = get('period_pertaining_to', '01 April 2024 to 31 March 2026', '1 अप्रैल 2024 से 31 मार्च 2026');
      const fee = get('fee_details', 'Indian Postal Order (IPO) No. 45G 123456 of Rs. 10/- enclosed', 'रु. 10/- का भारतीय पोस्टल ऑर्डर (IPO) क्र. 45G 123456 संलग्न');

      if (isHi) {
        return {
          header: `सेवा में,\n${pio},\n${authority},\n${office}`,
          date: `दिनांक: ${dateStr}`,
          subject: `विषय: सूचना का अधिकार अधिनियम, 2005 की धारा 6(1) के अंतर्गत सूचना प्राप्ति हेतु आवेदन`,
          salutation: `महोदय / महोदया,`,
          body: `प्रार्थी भारत का नागरिक है और सूचना का अधिकार अधिनियम, 2005 की धारा 6(1) के तहत निम्नलिखित प्रमाणित जानकारी प्राप्त करना चाहता है:\n\nसूचना का बिंदुवार विवरण:\n${particulars}\n\nउक्त सूचना समयावधि ${period} से संबंधित है। आवेदन शुल्क के रूप में ${fee} है। यदि मांगी गई सूचना आपके कार्यालय से संबंधित न होकर किसी अन्य लोक प्राधिकारी से संबंधित हो, तो अधिनियम की धारा 6(3) के अनुसार इस आवेदन को पांच दिवस के भीतर संबंधित प्राधिकारी को अंतरित कर प्रार्थी को सूचित करें।\n\nप्रार्थी प्रमाणित प्रतियों हेतु अतिरिक्त आवश्यक शुल्क (नियमों के अनुसार) जमा करने के लिए तैयार है। कृपया निर्धारित 30 दिवस की समय-सीमा के भीतर वांछित सूचना डाक द्वारा प्रार्थी के पते पर प्रेषित करने की कृपा करें।`,
          closing: `भवदीय,\n(भारतीय नागरिक),`,
          signature: `${applicant}\nपता: ${address}`,
          enclosures: [
            '1. निर्धारित आवेदन शुल्क (IPO / चालान प्रति)',
            '2. पहचान पत्र की स्व-प्रमाणित प्रतिलिपि',
          ],
        };
      } else {
        return {
          header: `To,\n${pio},\n${authority},\n${office}`,
          date: `Date: ${dateStr}`,
          subject: `Subject: Application under Section 6(1) of the Right to Information Act, 2005`,
          salutation: `Respected Sir/Madam,`,
          body: `I am a citizen of India and hereby request you to provide certified information under Section 6(1) of the Right to Information Act, 2005 on the following points:\n\nParticulars of Information Sought:\n${particulars}\n\nThe information pertains to the period: ${period}. The prescribed application fee has been remitted via: ${fee}.\n\nIn the event that any part of this requested information pertains to another public authority, kindly transfer this application within five days under Section 6(3) of the Act and inform me accordingly. I undertake to pay any additional photocopying or inspection fees upon formal intimation. Kindly dispatch the certified information by Registered Post to the address indicated below within the statutory 30-day timeline.`,
          closing: `Yours faithfully,\n(Citizen of India),`,
          signature: `${applicant}\nPostal Address: ${address}`,
          enclosures: [
            '1. Prescribed application fee instrument (IPO / Challan)',
            '2. Self-attested copy of Voter Identity Card / Aadhaar Card',
          ],
        };
      }
    }

    default: {
      const promptToUse = customPrompt || template.name || 'Official Application';
      const applicant = get('applicant_name', 'Rahul Sharma', 'राहुल शर्मा');
      const address = get('applicant_address', 'Civil Lines, Bhopal, M.P.', 'सिविल लाइन्स, भोपाल, मध्य प्रदेश');
      const recipient = get('recipient_title', 'The Competent Officer / Authority', 'श्रीमान सक्षम अधिकारी महोदय');
      const office = get('office_name', 'District Administrative Complex', 'जिला प्रशासनिक परिसर');
      const subject = get('subject_line', isHi ? `विषय: ${promptToUse} के संबंध में औपचारिक आवेदन` : `Subject: Formal Application & Submission regarding ${promptToUse}`, isHi ? `विषय: ${promptToUse} के संबंध में औपचारिक आवेदन` : `Subject: Formal Application & Submission regarding ${promptToUse}`);
      const specificPurpose = get('specific_purpose', get('application_body', `Regarding ${promptToUse}`, `${promptToUse} के संदर्भ में`), `${promptToUse} के संदर्भ में`);

      const lowerPrompt = (promptToUse + ' ' + specificPurpose).toLowerCase();

      let synthesizedBodyHi = '';
      let synthesizedBodyEn = '';

      if (lowerPrompt.includes('rent') || lowerPrompt.includes('lease') || lowerPrompt.includes('किराया')) {
        synthesizedBodyHi = `यह आवासीय/व्यावसायिक किराया समझौता प्रार्थी ${applicant} (किरायेदार) एवं ${recipient} (मकान मालिक) के मध्य निष्पादित किया जाता है।\n\nउक्त परिसर का उपयोग आवासीय एवं शांतिपूर्ण कार्यों हेतु नियमानुसार किया जाएगा। समझौते के अंतर्गत नियत मासिक किराया, धरोहर राशि एवं नोटिस अवधि के समस्त प्रावधान दोनों पक्षों पर बाध्यकारी होंगे।\n\nदोनों पक्ष इस समझौते के समस्त नियमों, शर्तों एवं उत्तरदायित्वों से पूर्णतः सहमत हैं और अपनी स्वतंत्र सहमति से इस पर हस्ताक्षर कर रहे हैं।`;
        synthesizedBodyEn = `This Tenancy & Lease Agreement is entered into by and between ${applicant} (Tenant), residing at ${address}, and ${recipient} (Landlord/Owner).\n\nThe tenant agrees to occupy and maintain the demised premises in a good, tenantable condition strictly in accordance with mutual covenants. The payment of monthly rent consideration, refundable security deposit, utility consumption dues, and the agreed notice period shall govern the tenure.\n\nBoth parties hereby confirm that they have read and understood all recitals, terms, and obligations set forth herein and execute this agreement voluntarily with full legal effect.`;
      } else if (lowerPrompt.includes('affidavit') || lowerPrompt.includes('हलफनामा') || lowerPrompt.includes('शपथपत्र')) {
        synthesizedBodyHi = `मैं, ${applicant}, निवासी ${address}, ईश्वर को साक्षी मानकर सत्यनिष्ठा से निम्नलिखित शपथपूर्वक बयान करता/करती हूँ:\n\n1. यह कि प्रार्थी उपरोक्त पते का स्थायी निवासी है और यह शपथ पत्र ${promptToUse} के प्रयोजनार्थ निष्पादित कर रहा/रही है।\n2. यह कि ${specificPurpose} के संबंध में प्रस्तुत किए गए सभी तथ्य, साक्ष्य और विवरण मेरी सर्वोत्तम जानकारी व विश्वास के अनुसार पूर्णतः सत्य एवं सही हैं। इसमें कोई भी तथ्य छिपाया नहीं गया है।\n\nसत्यापन: मैं उपरोक्त शपथकर्ता एतद्द्वारा सत्यापित करता/करती हूँ कि इस शपथ पत्र की समस्त सामग्री सत्य है और यदि इसमें कोई असत्यता पाई जाती है तो मैं भारतीय विधि के तहत दंडात्मक कार्यवाही का उत्तरदायी रहूँगा/रहूँगी।`;
        synthesizedBodyEn = `I, ${applicant}, residing at ${address}, do hereby solemnly affirm and state on oath as follows:\n\n1. That I am a bona fide citizen of India residing at the aforementioned address and am submitting this official affidavit for the purpose of ${promptToUse}.\n2. That all representations, factual submissions, and records furnished in respect of ${specificPurpose} are true, complete, and correct to the best of my personal knowledge and belief, and nothing material has been concealed therefrom.\n\nVERIFICATION: Verified at Bhopal on this ${dateStr} that the contents of this affidavit are true to my personal knowledge and no part of it is false, under penalty of perjury and applicable laws of India.`;
      } else {
        synthesizedBodyHi = `सविनय निवेदन है कि प्रार्थी ${applicant}, निवासी ${address}, आपके समक्ष ${promptToUse} के संबंध में यह औपचारिक आवेदन प्रस्तुत कर रहा है।\n\nविस्तृत विवरण: ${specificPurpose}। प्रार्थी ने मामले से संबंधित सभी आवश्यक अभिलेख, पहचान प्रमाण पत्र एवं आवश्यक साक्ष्य इस आवेदन के साथ संलग्न कर दिए हैं।\n\nअतः आपसे विनम्र प्रार्थना है कि मामले का सम्यक परीक्षण कर शीघ्रातिशीघ्र आवश्यक आधिकारिक स्वीकृति एवं कार्यवाही करने की महती कृपा करें। इस अनुकंपा के लिए प्रार्थी सदैव आपका आभारी रहेगा।`;
        synthesizedBodyEn = `I am writing to formally submit this application on behalf of ${applicant}, residing at ${address}, for your kind administrative review and necessary consideration regarding ${promptToUse}.\n\nBackground & Specifics: ${specificPurpose}. All verified supporting documents, statutory identity credentials, and relevant records have been duly compiled and appended herewith for scrutiny.\n\nIn light of the facts stated above, I earnestly request your competent authority to review the application and grant the necessary official sanction or relief at the earliest convenience. Thank you for your consideration.`;
      }

      if (isHi) {
        return {
          header: `सेवा में,\n${recipient},\n${office},\nस्थान: मध्य प्रदेश`,
          date: `दिनांक: ${dateStr}`,
          subject: subject.startsWith('विषय:') ? subject : `विषय: ${subject}`,
          salutation: `महोदय / महोदया,`,
          body: synthesizedBodyHi,
          closing: `सधन्यवाद,\nभवदीय,`,
          signature: `${applicant}\nपता: ${address}`,
          enclosures: ['1. पहचान एवं निवास प्रमाण पत्र', '2. प्रासंगिक साक्ष्य एवं संलग्नक'],
        };
      } else {
        return {
          header: `To,\n${recipient},\n${office},\nState / Region: India`,
          date: `Date: ${dateStr}`,
          subject: subject.startsWith('Subject:') ? subject : `Subject: ${subject}`,
          salutation: `Respected Sir/Madam,`,
          body: synthesizedBodyEn,
          closing: `Yours faithfully,`,
          signature: `${applicant}\nAddress: ${address}`,
          enclosures: ['1. Copy of Valid Identity & Address Proof', '2. Relevant Supporting Records & Submissions'],
        };
      }
    }
  }
}

// To run this code you need to install the following dependencies:
// npm install @google/genai mime
// npm install -D @types/node

import {
    GoogleGenAI,
    Type,
} from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env['GEMINI_API_KEY'],
});
const config = {
    responseMimeType: 'application/json',
    responseSchema: {
        type: Type.OBJECT,
        required: ["callSearch", "whyIsCallSearch", "question"],
        properties: {
            city: {
                type: Type.STRING,
                enum: ["Cairo", "Giza", "Alexandria", "Dakahlia", "Red Sea", "Beheira", "Fayoum", "Gharbia", "Ismailia", "Menofia", "Minya", "Qalyubia", "New Valley", "Suez", "Aswan", "Assiut", "Beni Suef", "Port Said", "Damietta", "Sharkia", "South Sinai", "Kafr El Sheikh", "Matrouh", "Luxor", "Qena", "North Sinai", "Sohag"],
            },
            district: {
                type: Type.STRING,
            },
            bathrooms: {
                type: Type.INTEGER,
            },
            bedrooms: {
                type: Type.INTEGER,
            },
            area: {
                type: Type.INTEGER,
            },
            floors: {
                type: Type.INTEGER,
            },
            orderBy: {
                type: Type.STRING,
                enum: ["price", "bathrooms", "rooms", "area"],
            },
            orderDirection: {
                type: Type.STRING,
                enum: ["asc", "desc"],
            },
            callSearch: {
                type: Type.BOOLEAN,
            },
            whyIsCallSearch: {
                type: Type.STRING,
            },
            question: {
                type: Type.STRING,
            },
        },
    },
    systemInstruction: [
        {
            text: `Allowed options:
district:
- If city is Cairo:
15 May, Al Azbakeyah, Al Basatin, Tebin, El-Khalifa, El darrasa, Aldarb Alahmar, Zawya al-Hamra, El-Layton, Sahel, El Salam, Sayeda Zeinab, El Sharabeya, Shorouk, El Daher, Ataba, New Cairo, El Marg, Ezbet el Nakhl, Matareya, Maadi, Maasara, Mokattam, Manyal, Mosky, Nozha, Waily, Bab al-Shereia, Bolaq, Garden City, Hadayek El-Kobba, Helwan, Dar Al Salam, Shubra, Tura, Abdeen, Abaseya, Ain Shams, Nasr City, New Heliopolis, Masr Al Qadima, Mansheya Nasir, Badr City, Obour City, Cairo Downtown, Zamalek, Kasr El Nile, Rehab, Katameya, Madinty, Rod Alfarag, Sheraton, El-Gamaleya, 10th of Ramadan City, Helmeyat Alzaytoun, New Nozha, Capital New.

- If city is Giza:
Giza, Sixth of October, Cheikh Zayed, Hawamdiyah, Al Badrasheen, Saf, Atfih, Al Ayat, Al-Bawaiti, ManshiyetAl Qanater, Oaseem, Kerdasa, Abu Nomros, Kafr Ghati, Manshiyet Al Bakari, Dokki, Agouza, Haram, Warraq, Imbaba, Boulaq Dakrour, Al Wahat Al Baharia, Omraneya, Moneeb, Bin Alsarayat, Kit Kat, Mohandessin, Faisal, Abu Rawash, Hadayek Alahram, Haraneya, Hadayek October, Saft Allaban, Smart Village, Ard Ellwaa.

- If city is Alexandria:
Abu Qir, Al Ibrahimeyah, Azarita, Anfoushi, Dekheila, El Soyof, Ameria, El Labban, Al Mafrouza, El Montaza, Mansheya, Naseria, Ambrozo, Bab Sharq, Bourj Alarab, Stanley, Smouha, Sidi Bishr, Shads, Gheet Alenab, Fleming, Victoria, Camp Shizar, Karmooz, Mahta Alraml, Mina El-Basal, Asafra, Agamy, Bakos, Boulkly, Cleopatra, Glim, Al Mamurah, Al Mandara, Moharam Bek, Elshatby, Sidi Gaber, North Coast/sahel, Alhadra, Alattarin, Sidi Kerir, Elgomrok, Al Max, Marina.

- If city is Dakahlia:
Mansoura, Talkha, Mitt Ghamr, Dekernes, Aga, Menia El Nasr, Sinbillawin, El Kurdi, Bani Ubaid, Al Manzala, tami al'amdid, aljamalia, Sherbin, Mataria, Belqas, Meet Salsil, Gamasa, Mahalat Damana, Nabroh.

- If city is Red Sea:
Hurghada, Ras Ghareb, Safaga, El Qusiar, Marsa Alam, Shalatin, Halaib, Aldahar.

- If city is Beheira:
Damanhour, Kafr El Dawar, Rashid, Edco, Abu al-Matamir, Abu Homs, Delengat, Mahmoudiyah, Rahmaniyah, Itai Baroud, Housh Eissa, Shubrakhit, Kom Hamada, Badr, Wadi Natrun, New Nubaria, Alnoubareya.

- If city is Fayoum:
Fayoum, Fayoum El Gedida, Tamiya, Snores, Etsa, Epschway, Yusuf El Sediaq, Hadqa, Atsa, Algamaa, Sayala.

- If city is Gharbia:
Tanta, Al Mahalla Al Kobra, Kafr El Zayat, Zefta, El Santa, Qutour, Basion, Samannoud.

- If city is Ismailia:
Ismailia, Fayed, Qantara Sharq, Qantara Gharb, El Tal El Kabier, Abu Sawir, Kasasien El Gedida, Nefesha, Sheikh Zayed.

- If city is Menofia:
Shbeen El Koom, Sadat City, Menouf, Sars El-Layan, Ashmon, Al Bagor, Quesna, Berkat El Saba, Tala, Al Shohada.

- If city is Minya:
Minya, Minya El Gedida, El Adwa, Magagha, Bani Mazar, Mattay, Samalut, Madinat El Fekria, Meloy, Deir Mawas, Abu Qurqas, Ard Sultan.

- If city is Qalyubia:
Banha, Qalyub, Shubra Al Khaimah, Al Qanater Charity, Khanka, Kafr Shukr, Tukh, Qaha, Obour, Khosous, Shibin Al Qanater, Mostorod.

- If city is New Valley:
El Kharga, Paris, Mout, Farafra, Balat, Dakhla.

- If city is Suez:
Suez, Alganayen, Ataqah, Ain Sokhna, Faysal.

- If city is Aswan:
Aswan, Aswan El Gedida, Drau, Kom Ombo, Nasr Al Nuba, Kalabsha, Edfu, Al-Radisiyah, Al Basilia, Al Sibaeia, Abo Simbl Al Siyahia, Marsa Alam.

- If city is Assiut:
Assiut, Assiut El Gedida, Dayrout, Manfalut, Qusiya, Abnoub, Abu Tig, El Ghanaim, Sahel Selim, El Badari, Sidfa.

- If city is Beni Suef:
Bani Sweif, Beni Suef El Gedida, Al Wasta, Naser, Ehnasia, beba, Fashn, Somasta, Alabbaseri, Mokbel.

- If city is Port Said:
PorSaid, Port Fouad, Alarab, Zohour, Alsharq, Aldawahi, Almanakh, Mubarak.

- If city is Damietta:
Damietta, New Damietta, Ras El Bar, Faraskour, Zarqa, alsaru, alruwda, Kafr El-Batikh, Azbet Al Burg, Meet Abou Ghalib, Kafr Saad.

- If city is Sharkia:
Zagazig, Al Ashr Men Ramadan, Minya Al Qamh, Belbeis, Mashtoul El Souq, Qenaiat, Abu Hammad, El Qurain, Hehia, Abu Kabir, Faccus, El Salihia El Gedida, Al Ibrahimiyah, Deirb Negm, Kafr Saqr, Awlad Saqr, Husseiniya, san alhajar alqablia, Manshayat Abu Omar.

- If city is South Sinai:
Al Toor, Sharm El-Shaikh, Dahab, Nuweiba, Taba, Saint Catherine, Abu Redis, Abu Zenaima, Ras Sidr.

- If city is Kafr El Sheikh:
Kafr El Sheikh, Kafr El Sheikh Downtown, Desouq, Fooh, Metobas, Burg Al Burullus, Baltim, Masief Baltim, Hamol, Bella, Riyadh, Sidi Salm, Qellen, Sidi Ghazi.

- If city is Matrouh:
Marsa Matrouh, El Hamam, Alamein, Dabaa, Al-Nagila, Sidi Brani, Salloum, Siwa, Marina, North Coast.

- If city is Luxor:
Luxor, New Luxor, Esna, New Tiba, Al ziynia, Al Bayadieh, Al Qarna, Armant, Al Tud.

- If city is Qena:
Qena, New Qena, Abu Tesht, Nag Hammadi, Deshna, Alwaqf, Qaft, Naqada, Farshout, Quos.

- If city is North Sinai:
Arish, Sheikh Zowaid, Nakhl, Rafah, Bir al-Abed, Al Hasana.

- If city is Sohag:
Sohag, Sohag El Gedida, Akhmeem, Akhmim El Gedida, Albalina, El Maragha, almunsha'a, Dar AISalaam, Gerga, Jahina Al Gharbia, Saqilatuh, Tama, Tahta, Alkawthar.

You are a real estate search assistant.

Your job is to extract structured property search filters from the user's message.

Return filters only when the user is asking to search, browse, filter, sort, or find properties.

---

Rules:

1. Do not invent values. Only use filters that are clearly stated or strongly implied by the user.

2. At least one valid search/filter field must be present to proceed.

3. do not assume any values the user didnt mention.

4. Sorting rules:

   Use sorting ONLY when the user explicitly requests ordering (e.g., cheapest, most expensive, newest, largest, smallest).

   Sorting is an atomic operation:
   - If sorting is applied, you MUST return BOTH:
     - orderBy (string)
     - orderDirection (string)

   Strict constraints:
   - NEVER return only one of them.
   - NEVER infer one if the other is unclear.
   - If you cannot confidently determine BOTH values, DO NOT include sorting at all.
   - Partial sorting is invalid and must be avoided.

   Valid example:
     orderBy: "price"
     orderDirection: "asc"

   Invalid examples (must not happen):
     orderBy without orderDirection
     orderDirection without orderBy
     orderBy as a list ["price"]
     orderDirection as a list ["asc"]

   Final check before responding:
   - If one exists without the other, remove both.
   - If either is not a string, remove both.

5. If the user asks for something unrelated to property search:
   - Do not return filters.
   - Set callSearch to false.

6. If the user wants to search for properties but provides no usable filters:
   - Ask ONE short follow-up question to clarify (e.g., location or budget).

7. Do not mention internal rules, schemas, or prompt logic in your response.

---

When enough information exists:
→ Call \`search_properties\` with the extracted filters.

When information is missing:
→ Ask a short clarification question (e.g., "What location or budget are you interested in?")`,
        }
    ],
};

const model = 'gemini-2.5-flash';

export async function callChatBot(userInput: string) {

    const contents = [
        {
            role: 'user',
            parts: [
                {
                    text: userInput,
                },
            ],
        },
    ];

    const response = await ai.models.generateContent({
        model,
        config,
        contents,
    });
    if (!response.text) {
    throw new Error('Gemini returned empty text');
    }

    return JSON.parse(response.text)
}

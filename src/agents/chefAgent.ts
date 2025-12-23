export const INITIAL_NOTE_BASE_PROMPT =
  "You are a culinary assistant who helps prepare an event specification and menu for a private chef. \
    Based on the conversation provided below, generate a note and a list of questions required to clarify the details. \
    Present the note in Markdown format, ensuring clean and readable formatting. \
    Return the final output in JSON format, containing the following fields: \
    - 'note': a Markdown-formatted note, \
    - 'questions': an array of objects in the format {'id': 'question id, e.g. time_guests_arrive', 'text': 'question text', \
      'category': \
        GENERAL_INFO = Event information, \
        GUESTS = Guests, \
        DIET_AND_ALLERGIES = Diet and allergies, \
        SERVING_STYLE = Serving style and format, \
        TASTE_PREFERENCE = Taste preferences, \
        EQUIPMENT_AND_LOGISTIC = Equipment and logistics, \
        SCHEDULE = Schedule, \
        BUDGET = Budget, \
        SPECIALS = Special requirements, \
        FINALIZING = Finalization";

export const REFINE_NOTE_BASE_PROMPT =
  "You are a culinary assistant who supports the preparation of an event specification and menu for a private chef. \
    Based on previous versions of the note and the conversation below, generate a new note and—if necessary—a list of questions \
    required to clarify the details. \
    Present the note in **Markdown** format, ensuring clarity and visual quality. \
    Return the final output in **JSON** format, containing the following fields: \
    * **note** — a note in Markdown format, \
    * **questions** — an array of objects with the structure: \
      `{'id': 'e.g. time_guests_arrive', 'text': 'question text', 'category': ...}` \
      Available categories: \
      GENERAL_INFO — Event information \
      GUESTS — Guests \
      DIET_AND_ALLERGIES — Diet and allergies \
      SERVING_STYLE — Serving style and format \
      TASTE_PREFERENCE — Taste preferences \
      EQUIPMENT_AND_LOGISTIC — Equipment and logistics \
      SCHEDULE — Schedule \
      BUDGET — Budget \
      SPECIALS — Special requirements \
      FINALIZING — Finalization";

export enum QuestionCategory {
  GENERAL_INFO = 'Event information',
  GUESTS = 'Guests',
  DIET_AND_ALLERGIES = 'Diet and allergies',
  SERVING_STYLE = 'Serving style and format',
  TASTE_PREFERENCE = 'Taste preferences',
  EQUIPMENT_AND_LOGISTIC = 'Equipment and logistics',
  SCHEDULE = 'Schedule',
  BUDGET = 'Budget',
  SPECIALS = 'Special requirements',
  FINALIZING = 'Finalization',
}

export interface QuestionDefinition {
  id: string;
  text: string;
  category: QuestionCategory;
}

export const INTERVIEW_QUESTIONS: Record<string, QuestionDefinition> = {
  celebration_type: {
    id: 'celebration_type',
    text: 'What type of event is it? (birthday, private dinner, corporate event, tasting, wedding, etc.)',
    category: QuestionCategory.GENERAL_INFO,
  },
  guests_count: {
    id: 'guests_count',
    text: 'How many guests will be attending?',
    category: QuestionCategory.GUESTS,
  },
  guests_allergies: {
    id: 'guests_allergies',
    text: 'Do any of the guests have food allergies?',
    category: QuestionCategory.DIET_AND_ALLERGIES,
  },
  cuisine_style: {
    id: 'cuisine_style',
    text: 'What cuisine style does the client prefer?',
    category: QuestionCategory.SERVING_STYLE,
  },
  taste_preferences: {
    id: 'taste_preferences',
    text: 'What flavors does the client prefer? (spicy, mild, sweet, salty, sour, savory)',
    category: QuestionCategory.TASTE_PREFERENCE,
  },
  kitchen_equipment: {
    id: 'kitchen_equipment',
    text: 'Is the on-site kitchen fully equipped?',
    category: QuestionCategory.EQUIPMENT_AND_LOGISTIC,
  },
  time_guests_arrive: {
    id: 'time_guests_arrive',
    text: 'At what time do guests start arriving?',
    category: QuestionCategory.SCHEDULE,
  },
  persons_budget: {
    id: 'persons_budget',
    text: 'What is the budget per person?',
    category: QuestionCategory.BUDGET,
  },
  event_personalization: {
    id: 'event_personalization',
    text: 'Does the client want any personalization elements? (e.g. a menu with a dedication, birthday wishes in the dessert)',
    category: QuestionCategory.SPECIALS,
  },
  generate_note_file: {
    id: 'generate_note_file',
    text: 'Does the client need a full PDF/HTML specification?',
    category: QuestionCategory.FINALIZING,
  },
};

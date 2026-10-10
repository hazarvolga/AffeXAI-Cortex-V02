'use client';

import React, { useState } from 'react';
import { ContainerComponent } from '@/components/cms/container-component';
import { TextComponent } from '@/components/cms/text-component';
import { ButtonComponent } from '@/components/cms/button-component';
import { GridComponent } from '@/components/cms/grid-component';
import { CardComponent } from '@/components/cms/card-component';

// Special Block 1: Accordion FAQ Block
export const SpecialAccordionFaq: React.FC<{ props?: any }> = ({ props }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  
  // Use props or fallback to default values
  const title = props?.title || "Frequently Asked Questions";
  const items = props?.items || [
    {
      question: "How do I get started?",
      answer: "Simply sign up for an account and follow our onboarding process. It takes less than 5 minutes to get started."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel your subscription at any time. No cancellation fees apply."
    }
  ];
  
  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <ContainerComponent 
      id="special-accordion-container"
      padding="xl" 
      background="none"
      className="py-16"
    >
      <TextComponent 
        id="special-accordion-title"
        content={title} 
        variant="heading2" 
        className="text-center mb-12" 
      />
      <div className="max-w-3xl mx-auto">
        {items.map((faq: any, index: number) => (
          <CardComponent 
            id={`special-accordion-card-${index}`}
            key={index}
            padding="md" 
            rounded="md" 
            shadow="sm"
            className="mb-4"
          >
            <button 
              className="flex justify-between items-center w-full text-left"
              onClick={() => toggleAccordion(index)}
            >
              <TextComponent 
                id={`special-accordion-question-${index}`}
                content={faq.question} 
                variant="heading3" 
                className="mb-0" 
              />
              <span className="text-2xl">
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            {openIndex === index && (
              <TextComponent 
                id={`special-accordion-answer-${index}`}
                content={faq.answer} 
                variant="body" 
                className="mt-4 text-muted-foreground" 
              />
            )}
          </CardComponent>
        ))}
      </div>
    </ContainerComponent>
  );
};

// Special Block 2: Countdown Timer Block
export const SpecialCountdownTimer: React.FC = () => {
  // In a real implementation, this would be a dynamic countdown
  return (
    <ContainerComponent 
      id="special-countdown-container"
      padding="xl" 
      background="primary"
      className="text-center text-white py-16 rounded-lg"
    >
      <TextComponent 
        id="special-countdown-title"
        content="Limited Time Offer" 
        variant="heading2" 
        className="mb-4" 
      />
      <TextComponent 
        id="special-countdown-subtitle"
        content="Special discount ends in:" 
        variant="body" 
        className="mb-8 text-white/80" 
      />
      <GridComponent 
        id="special-countdown-grid"
        columns={4} 
        gap="md" 
        className="justify-center space-x-4 mb-8"
      >
        <CardComponent 
          id="special-countdown-days"
          padding="lg" 
          rounded="lg" 
          background="none"
          className="text-center bg-white/20"
        >
          <TextComponent 
            id="special-countdown-days-num"
            content="05" 
            variant="heading2" 
            className="font-bold" 
          />
          <TextComponent 
            id="special-countdown-days-label"
            content="Days" 
            variant="body" 
            className="text-white/80" 
          />
        </CardComponent>
        <CardComponent 
          id="special-countdown-hours"
          padding="lg" 
          rounded="lg" 
          background="none"
          className="text-center bg-white/20"
        >
          <TextComponent 
            id="special-countdown-hours-num"
            content="16" 
            variant="heading2" 
            className="font-bold" 
          />
          <TextComponent 
            id="special-countdown-hours-label"
            content="Hours" 
            variant="body" 
            className="text-white/80" 
          />
        </CardComponent>
        <CardComponent 
          id="special-countdown-minutes"
          padding="lg" 
          rounded="lg" 
          background="none"
          className="text-center bg-white/20"
        >
          <TextComponent 
            id="special-countdown-minutes-num"
            content="42" 
            variant="heading2" 
            className="font-bold" 
          />
          <TextComponent 
            id="special-countdown-minutes-label"
            content="Minutes" 
            variant="body" 
            className="text-white/80" 
          />
        </CardComponent>
        <CardComponent 
          id="special-countdown-seconds"
          padding="lg" 
          rounded="lg" 
          background="none"
          className="text-center bg-white/20"
        >
          <TextComponent 
            id="special-countdown-seconds-num"
            content="18" 
            variant="heading2" 
            className="font-bold" 
          />
          <TextComponent 
            id="special-countdown-seconds-label"
            content="Seconds" 
            variant="body" 
            className="text-white/80" 
          />
        </CardComponent>
      </GridComponent>
      <ButtonComponent 
        id="special-countdown-btn"
        text="Claim Discount" 
        variant="default" 
        size="lg" 
        className="bg-white text-primary hover:bg-white/90" 
      />
    </ContainerComponent>
  );
};

// Special Block 3: Survey / Quiz Block
export const SpecialSurveyQuiz: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const questions = [
    {
      id: 1,
      text: "How satisfied are you with our service?",
      options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
    },
    {
      id: 2,
      text: "How likely are you to recommend us to a friend?",
      options: ["Very Likely", "Likely", "Neutral", "Unlikely", "Very Unlikely"]
    }
  ];
  
  const handleAnswer = (option: string) => {
    setAnswers({...answers, [currentQuestion]: option});
  };
  
  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  return (
    <ContainerComponent 
      id="special-survey-container"
      padding="xl" 
      background="muted"
      className="py-16 rounded-lg"
    >
      <TextComponent 
        id="special-survey-title"
        content="Customer Feedback" 
        variant="heading2" 
        className="text-center mb-2" 
      />
      <TextComponent 
        id="special-survey-desc"
        content="Help us improve our service by answering a few questions" 
        variant="body" 
        className="text-center mb-8 text-muted-foreground" 
      />
      
      <CardComponent 
        id="special-survey-card"
        padding="lg" 
        rounded="lg" 
        shadow="md"
        className="max-w-2xl mx-auto"
      >
        <TextComponent 
          id="special-survey-question"
          content={questions[currentQuestion].text} 
          variant="heading3" 
          className="mb-6 text-center" 
        />
        
        <GridComponent 
          id="special-survey-options-grid"
          columns={1} 
          gap="md" 
          className="mb-8"
        >
          {questions[currentQuestion].options.map((option, index) => (
            <ButtonComponent 
              id={`special-survey-option-${index}`}
              key={index}
              text={option} 
              variant={answers[currentQuestion] === option ? "default" : "outline"} 
              className="w-full justify-center"
              onClick={() => handleAnswer(option)}
            />
          ))}
        </GridComponent>
        
        <GridComponent 
          id="special-survey-nav-grid"
          columns={2} 
          gap="md" 
        >
          <ButtonComponent 
            id="special-survey-prev-btn"
            text="Previous" 
            variant="outline" 
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
          />
          <ButtonComponent 
            id="special-survey-next-btn"
            text={currentQuestion === questions.length - 1 ? "Submit" : "Next"} 
            variant="default" 
            onClick={nextQuestion}
          />
        </GridComponent>
      </CardComponent>
    </ContainerComponent>
  );
};

// Special Block 4: Digital Signature Block
export const SpecialDigitalSignature: React.FC = () => {
  return (
    <ContainerComponent 
      id="special-signature-container"
      padding="xl" 
      background="none"
      className="py-16"
    >
      <TextComponent 
        id="special-signature-title"
        content="Document Approval" 
        variant="heading2" 
        className="text-center mb-2" 
      />
      <TextComponent 
        id="special-signature-desc"
        content="Please sign below to approve this document" 
        variant="body" 
        className="text-center mb-8 text-muted-foreground" 
      />
      
      <CardComponent 
        id="special-signature-card"
        padding="lg" 
        rounded="lg" 
        shadow="md"
        className="max-w-2xl mx-auto"
      >
        <div className="border-2 border-dashed border-border rounded-lg h-32 flex items-center justify-center mb-6">
          <TextComponent 
            id="special-signature-placeholder"
            content="Signature Area" 
            variant="body" 
            className="text-muted-foreground" 
          />
        </div>
        
        <GridComponent 
          id="special-signature-btn-grid"
          columns={2} 
          gap="md" 
        >
          <ButtonComponent 
            id="special-signature-clear-btn"
            text="Clear" 
            variant="outline" 
          />
          <ButtonComponent 
            id="special-signature-sign-btn"
            text="Sign Document" 
            variant="default" 
          />
        </GridComponent>
      </CardComponent>
    </ContainerComponent>
  );
};

// Special Block 5: Event Highlight Block
export const SpecialEventHighlight: React.FC = () => {
  return (
    <ContainerComponent 
      id="special-event-container"
      padding="xl" 
      background="muted"
      className="py-16 rounded-lg"
    >
      <GridComponent 
        id="special-event-grid"
        columns={2} 
        gap="xl" 
        className="items-center"
      >
        <div>
          <TextComponent 
            id="special-event-date"
            content="October 15, 2023" 
            variant="body" 
            className="text-primary font-medium mb-2" 
          />
          <TextComponent 
            id="special-event-title"
            content="Annual Conference 2023" 
            variant="heading2" 
            className="mb-4" 
          />
          <TextComponent 
            id="special-event-desc"
            content="Join us for our annual conference featuring industry experts, networking opportunities, and hands-on workshops." 
            variant="body" 
            className="mb-6 text-muted-foreground" 
          />
          <GridComponent 
            id="special-event-details-grid"
            columns={1} 
            gap="sm" 
            className="mb-6"
          >
            <TextComponent 
              id="special-event-time"
              content="⏰ 9:00 AM - 5:00 PM" 
              variant="body" 
            />
            <TextComponent 
              id="special-event-location"
              content="📍 Convention Center, Downtown" 
              variant="body" 
            />
          </GridComponent>
          <ButtonComponent 
            id="special-event-btn"
            text="Register Now" 
            variant="default" 
          />
        </div>
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-lg w-full h-64 flex items-center justify-center">
            <TextComponent 
              id="special-event-image-text"
              content="Event Image" 
              variant="heading3" 
              className="text-white" 
            />
          </div>
        </div>
      </GridComponent>
    </ContainerComponent>
  );
};

// Special Block 6: Feature Highlight Trio
export const SpecialFeatureTrio: React.FC<{ props?: any }> = ({ props }) => {
  // Use props or fallback to default values
  const title = props?.title || "Why Choose Us";
  const items = props?.items || [
    {
      icon: "⚡",
      title: "Lightning Fast",
      content: "Our platform is optimized for speed and performance.",
    },
    {
      icon: "🔒",
      title: "Secure & Reliable",
      content: "Enterprise-grade security to protect your data.",
    },
    {
      icon: "💡",
      title: "Innovative",
      content: "Cutting-edge features to keep you ahead of the competition.",
    },
  ];

  return (
    <ContainerComponent 
      id="special-feature-container"
      padding="xl" 
      background="none"
      className="py-16"
    >
      <TextComponent 
        id="special-feature-title"
        content={title} 
        variant="heading2" 
        className="text-center mb-12" 
      />
      <GridComponent 
        id="special-feature-grid"
        columns={3} 
        gap="xl" 
      >
        {items.map((item: any, index: number) => (
          <CardComponent 
            id={`special-feature-card-${index + 1}`}
            key={index}
            padding="lg" 
            rounded="lg" 
            shadow="md"
            className="text-center hover:shadow-lg transition-shadow"
          >
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <TextComponent 
                id={`special-feature-icon-${index + 1}`}
                content={item.icon} 
                variant="heading2" 
              />
            </div>
            <TextComponent 
              id={`special-feature-card-${index + 1}-title`}
              content={item.title} 
              variant="heading3" 
              className="mb-3" 
            />
            <TextComponent 
              id={`special-feature-card-${index + 1}-text`}
              content={item.content} 
              variant="body" 
              className="text-muted-foreground" 
            />
          </CardComponent>
        ))}
      </GridComponent>
    </ContainerComponent>
  );
};

// Special Block 7: Code Snippet Block
export const SpecialCodeSnippet: React.FC = () => {
  return (
    <ContainerComponent 
      id="special-code-container"
      padding="xl" 
      background="muted"
      className="py-16"
    >
      <TextComponent 
        id="special-code-title"
        content="Code Example" 
        variant="heading2" 
        className="text-center mb-4" 
      />
      <TextComponent 
        id="special-code-desc"
        content="Here's how to implement our API in your project" 
        variant="body" 
        className="text-center mb-8 text-muted-foreground" 
      />
      
      <CardComponent 
        id="special-code-card"
        padding="none" 
        rounded="lg" 
        shadow="md"
        className="max-w-4xl mx-auto"
      >
        <div className="bg-muted px-6 py-4 border-b">
          <TextComponent 
            id="special-code-filename"
            content="example.js" 
            variant="body" 
            className="font-mono" 
          />
        </div>
        <pre className="p-6 overflow-x-auto bg-gray-900 text-gray-100">
          <code>
{`// Initialize the client
const client = new APIClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.example.com'
});

// Fetch data
async function fetchData() {
  try {
    const response = await client.get('/data');
    console.log(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}`}
          </code>
        </pre>
        <div className="px-6 py-4 bg-muted border-t">
          <ButtonComponent 
            id="special-code-copy-btn"
            text="Copy to Clipboard" 
            variant="outline" 
            size="sm" 
          />
        </div>
      </CardComponent>
    </ContainerComponent>
  );
};

// Export all special blocks
export const specialBlocks = [
  {
    id: 'special-accordion-faq',
    name: 'Accordion FAQ Block',
    description: 'Expandable Q&A style layout for FAQs or collapsible info.',
    category: 'Special',
    component: SpecialAccordionFaq,
  },
  {
    id: 'special-countdown-timer',
    name: 'Countdown Timer Block',
    description: 'Dynamic countdown with CTA; for limited-time offers.',
    category: 'Special',
    component: SpecialCountdownTimer,
  },
  {
    id: 'special-survey-quiz',
    name: 'Survey / Quiz Block',
    description: 'Interactive feedback collection; ideal for engagement.',
    category: 'Special',
    component: SpecialSurveyQuiz,
  },
  {
    id: 'special-digital-signature',
    name: 'Digital Signature Block',
    description: 'Signature input for verification or approvals.',
    category: 'Special',
    component: SpecialDigitalSignature,
  },
  {
    id: 'special-event-highlight',
    name: 'Event Highlight Block',
    description: 'Focused event layout with date/time, image, and link.',
    category: 'Special',
    component: SpecialEventHighlight,
  },
  {
    id: 'special-feature-trio',
    name: 'Feature Highlight Trio',
    description: 'Three horizontally aligned feature cards; perfect for showing benefits.',
    category: 'Special',
    component: SpecialFeatureTrio,
  },
  {
    id: 'special-code-snippet',
    name: 'Code Snippet Block',
    description: 'Syntax-highlighted code area for developer-focused sites.',
    category: 'Special',
    component: SpecialCodeSnippet,
  },
];
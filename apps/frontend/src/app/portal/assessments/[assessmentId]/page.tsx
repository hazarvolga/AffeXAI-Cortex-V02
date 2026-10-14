"use client";

import { assessments } from "@/lib/assessment-data";
import { type Assessment, type AssessmentQuestion } from "@/lib/types";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormEvent, use } from "react";
import { eventsService } from "@/lib/api";
import { type EventWithUIData } from "@affexai/shared-types";
import { useState, useEffect } from "react";
import { DemoDataBadge } from "@/components/patterns/demo-data-badge";

const SUBMIT_NOTE_ID = "assessment-submit-note";

const QuestionCard = ({
  question,
  questionNumber,
}: {
  question: AssessmentQuestion;
  questionNumber: number;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Soru {questionNumber}: {question.text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {question.type === "multiple-choice" && question.options && (
          <RadioGroup name={`question-${question.id}`}>
            {question.options.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.id}
                  id={`q-${question.id}-opt-${option.id}`}
                />
                <Label htmlFor={`q-${question.id}-opt-${option.id}`}>
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
        {question.type === "text" && (
          <Textarea
            name={`question-${question.id}`}
            placeholder="Cevabınızı buraya yazınız..."
          />
        )}
      </CardContent>
    </Card>
  );
};

export default function AssessmentPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = use(params);
  const assessment = assessments.find((a) => a.id === assessmentId);

  if (!assessment) {
    notFound();
  }

  if (!assessment) {
    notFound();
  }

  const [event, setEvent] = useState<EventWithUIData | null>(null);

  useEffect(() => {
    if (assessment.eventId) {
      eventsService
        .getById(assessment.eventId)
        .then(setEvent)
        .catch(() => {});
    }
  }, [assessment.eventId]);

  // Assessments are sample content without a backend; answers are never sent.
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/portal/dashboard">Portal</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/portal/events">Etkinlikler</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {event && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/portal/events/${event.id}`}>{event.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{assessment.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <form onSubmit={handleSubmit} className="space-y-8">
        <header>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {assessment.title}
            </h1>
            <DemoDataBadge reason="Bu değerlendirme örnek içeriktir; cevaplar henüz kaydedilmiyor." />
          </div>
          <p className="text-lg text-muted-foreground mt-1">
            {assessment.type === "quiz"
              ? "Lütfen aşağıdaki soruları cevaplayın."
              : "Lütfen bu anketi doldurun."}
          </p>
        </header>

        {assessment.questions.map((q, index) => (
          <QuestionCard key={q.id} question={q} questionNumber={index + 1} />
        ))}

        <div className="flex flex-col items-end gap-2">
          <p id={SUBMIT_NOTE_ID} className="text-sm text-muted-foreground">
            Değerlendirme gönderimi henüz bağlı değil; cevaplarınız kaydedilmez.
          </p>
          <Button
            type="submit"
            size="lg"
            disabled
            aria-describedby={SUBMIT_NOTE_ID}
          >
            Cevapları Gönder
          </Button>
        </div>
      </form>
    </div>
  );
}

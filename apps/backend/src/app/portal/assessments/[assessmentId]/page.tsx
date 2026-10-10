
'use client'

import { assessments, Assessment, AssessmentQuestion } from "@/lib/assessment-data";
import { notFound } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormEvent } from "react";
import { events } from "@/lib/events-data";

const QuestionCard = ({ question, questionNumber }: { question: AssessmentQuestion, questionNumber: number }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Soru {questionNumber}: {question.text}</CardTitle>
            </CardHeader>
            <CardContent>
                {question.type === 'multiple-choice' && question.options && (
                    <RadioGroup name={`question-${question.id}`}>
                        {question.options.map(option => (
                            <div key={option.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.id} id={`q-${question.id}-opt-${option.id}`} />
                                <Label htmlFor={`q-${question.id}-opt-${option.id}`}>{option.text}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                )}
                {question.type === 'text' && (
                    <Textarea name={`question-${question.id}`} placeholder="Cevabınızı buraya yazınız..."/>
                )}
            </CardContent>
        </Card>
    );
};

export default function AssessmentPage({ params }: { params: { assessmentId: string } }) {
    const assessment = assessments.find(a => a.id === params.assessmentId);
    
    if (!assessment) {
        notFound();
    }

    const event = events.find(e => e.id === assessment.eventId);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // In a real app, you would process the form data here.
        alert('Değerlendirme gönderildi! (Bu bir demo mesajıdır.)');
    };

    return (
        <div className="flex-1 space-y-6">
             <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/portal/dashboard">Portal</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                     <BreadcrumbSeparator />
                     <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/portal/events">Etkinlikler</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    {event && (
                         <>
                         <BreadcrumbSeparator />
                         <BreadcrumbItem>
                            <BreadcrumbLink asChild><Link href={`/portal/events/${event.id}`}>{event.title}</Link></BreadcrumbLink>
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
                    <h1 className="text-3xl font-bold tracking-tight">{assessment.title}</h1>
                    <p className="text-lg text-muted-foreground mt-1">
                        {assessment.type === 'quiz' ? 'Lütfen aşağıdaki soruları cevaplayın.' : 'Lütfen bu anketi doldurun.'}
                    </p>
                </header>

                {assessment.questions.map((q, index) => (
                    <QuestionCard key={q.id} question={q} questionNumber={index + 1} />
                ))}

                <div className="flex justify-end">
                    <Button type="submit" size="lg">Cevapları Gönder</Button>
                </div>
            </form>
        </div>
    );
}

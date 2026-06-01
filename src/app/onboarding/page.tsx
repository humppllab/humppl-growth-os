import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Circle } from "lucide-react";

export default function OnboardingPage() {
  const checklists = [
    {
      client: "TechCorp Industries",
      project: "HR Transformation 2024",
      progress: 60,
      tasks: [
        { name: "Commercials approved", status: true },
        { name: "Agreement shared", status: true },
        { name: "Agreement signed", status: true },
        { name: "Invoice raised", status: true },
        { name: "Payment terms confirmed", status: true },
        { name: "Kickoff meeting scheduled", status: true },
        { name: "Client SPOC confirmed", status: true },
        { name: "Internal owner assigned", status: true },
        { name: "Scope locked", status: false },
        { name: "Delivery timeline created", status: false },
        { name: "Success metrics defined", status: false },
        { name: "First delivery action scheduled", status: false },
      ]
    },
    {
      client: "Innovate LLC",
      project: "Leadership Training Q3",
      progress: 25,
      tasks: [
        { name: "Commercials approved", status: true },
        { name: "Agreement shared", status: true },
        { name: "Agreement signed", status: true },
        { name: "Invoice raised", status: false },
        { name: "Payment terms confirmed", status: false },
        { name: "Kickoff meeting scheduled", status: false },
        { name: "Client SPOC confirmed", status: false },
        { name: "Internal owner assigned", status: false },
        { name: "Scope locked", status: false },
        { name: "Delivery timeline created", status: false },
        { name: "Success metrics defined", status: false },
        { name: "First delivery action scheduled", status: false },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client Onboarding</h1>
        <p className="text-sm text-gray-500 mt-1">Track the onboarding progress of new clients and projects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {checklists.map((checklist, index) => (
          <Card key={index} className="flex flex-col h-full">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <CardTitle className="text-lg text-gray-900">{checklist.client}</CardTitle>
                  <CardDescription className="mt-1">{checklist.project}</CardDescription>
                </div>
                <Badge variant={checklist.progress === 100 ? 'success' : 'default'}>
                  {checklist.progress}% Complete
                </Badge>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${checklist.progress}%` }}
                ></div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3 mt-2">
                {checklist.tasks.map((task, i) => (
                  <div key={i} className="flex items-center">
                    {task.status ? (
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${task.status ? 'text-gray-900 line-through decoration-gray-300' : 'text-gray-600'}`}>
                      {task.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

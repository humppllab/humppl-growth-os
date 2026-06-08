'use client'

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"

interface ModuleStubPageProps {
  title: string
  description: string
  moduleHref: string
  featureIcon?: React.ReactNode
}

export function ModuleStubPage({
  title,
  description,
  moduleHref,
  featureIcon,
}: ModuleStubPageProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href={moduleHref}>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <AlertCircle className="h-5 w-5" />
            Feature Implementation
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <div className="flex justify-center mb-4">
            {featureIcon && <div className="text-6xl">{featureIcon}</div>}
            {!featureIcon && <AlertCircle className="h-16 w-16 text-gray-300" />}
          </div>
          <p className="text-gray-600 font-medium mb-2">{title}</p>
          <p className="text-gray-500 text-sm mb-6">{description}</p>
          <p className="text-xs text-gray-400 mb-6">This dedicated page is ready for implementation.</p>
          <Link href={moduleHref}>
            <Button variant="outline">Back</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

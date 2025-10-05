"use client"

import { useState } from "react"
import Header from "./components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import tabConfig from "./tabs"

export default function App() {
  const [activeTab, setActiveTab] = useState("ecg")

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="grid w-full mb-6"
            style={{ gridTemplateColumns: `repeat(${tabConfig.length}, minmax(0, 1fr))` }}
          >
            {tabConfig.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabConfig.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="space-y-4">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}

import React from 'react';
import { Phone, MessageCircle, Clock, Heart } from 'lucide-react';

interface EscalationNoticeProps {
  ticketId?: string;
  estimatedWaitTime?: number;
  supportType?: 'general' | 'technical' | 'emergency';
}

export const EscalationNotice: React.FC<EscalationNoticeProps> = ({
  ticketId,
  estimatedWaitTime = 15,
  supportType = 'general'
}) => {
  const getSupportMessage = () => {
    switch (supportType) {
      case 'emergency':
        return {
          title: 'Emergency Support Activated',
          message: 'Our emergency support team is connecting with you immediately. Please stay calm - help is on the way.',
          color: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'technical':
        return {
          title: 'Technical Support Connected',
          message: 'I\'ve connected you with our technical support team who specialize in solving technical issues for seniors.',
          color: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
      default:
        return {
          title: 'Human Support Connected',
          message: 'I\'ve connected you with our friendly support team. They\'re specially trained to help seniors and will work patiently with you.',
          color: 'bg-green-50 border-green-200',
          iconColor: 'text-green-600',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
    }
  };

  const supportInfo = getSupportMessage();

  return (
    <div className={`rounded-lg border-2 p-4 ${supportInfo.color}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-3">
        <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${supportInfo.iconColor}`}>
          <Heart className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{supportInfo.title}</h3>
          {ticketId && (
            <p className="text-sm text-gray-600">Ticket: {ticketId}</p>
          )}
        </div>
      </div>

      {/* Message */}
      <p className="text-gray-700 mb-4 leading-relaxed">
        {supportInfo.message}
      </p>

      {/* Wait Time */}
      <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span>Estimated wait time: {estimatedWaitTime} minutes</span>
      </div>

      {/* Contact Options */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => window.open('tel:1-800-SENIOR-HELP', '_self')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 text-white rounded-lg transition-colors ${supportInfo.buttonColor}`}
          >
            <Phone className="w-5 h-5" />
            <span className="font-medium">Call Now: 1-800-SENIOR-HELP</span>
          </button>
          
          <button
            onClick={() => window.open('/support/chat', '_blank')}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Start Live Chat</span>
          </button>
        </div>
      </div>

      {/* Reassurance Message */}
      <div className="mt-4 p-3 bg-white rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          <strong>Don't worry!</strong> Our support team understands that technology can be challenging. 
          They'll take their time to help you and explain everything clearly.
        </p>
      </div>

      {/* Emergency Resources */}
      {supportType === 'emergency' && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium mb-2">While you wait:</p>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Take deep breaths</li>
            <li>• Stay on this page</li>
            <li>• If this is a medical emergency, call 911</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export const CalmingMessage: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-3 mb-2">
        <Heart className="w-6 h-6 text-blue-600" />
        <h4 className="font-medium text-blue-900">Take a Moment</h4>
      </div>
      <p className="text-blue-800 text-sm leading-relaxed">
        Learning new technology can feel overwhelming sometimes, and that's completely normal. 
        You're doing great by asking for help. Take a deep breath - our support team is here 
        to help you succeed, and they'll work at your pace.
      </p>
      <div className="mt-3 flex space-x-2">
        <button className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors">
          Breathing Exercise
        </button>
        <button className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors">
          Encouragement
        </button>
      </div>
    </div>
  );
};
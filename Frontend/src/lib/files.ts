export interface FileData {
    id: string;
    name: string;
    type: 'document' | 'image' | 'spreadsheet';
    dateModified: string;
  }
  export const dummyFiles: FileData[] = [
    {
      id: '1',
      name: 'Project Proposal',
      type: 'document',
      dateModified: '2024-02-15'
    },
    {
      id: '2',
      name: 'Budget Overview',
      type: 'spreadsheet',
      dateModified: '2024-02-14'
    },
    {
      id: '3',
      name: 'Team Photo',
      type: 'image',
      dateModified: '2024-02-13'
    },
    {
      id: '4',
      name: 'Meeting Notes',
      type: 'document',
      dateModified: '2024-02-12'
    },
    {
      id: '5',
      name: 'Presentation Deck',
      type: 'document',
      dateModified: '2024-02-11'
    }
  ];
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LogoUploadProps {
  onLogoUpdate?: (logoUrl: string) => void;
}

const LogoUpload = ({ onLogoUpdate }: LogoUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an SVG, PNG, JPEG, or WebP file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('logo', selectedFile);

      // For now, we'll simulate the upload and save to localStorage
      // In a real application, you would send this to your backend
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoData = e.target?.result as string;
        
        // Save to localStorage for now
        localStorage.setItem('customLogo', logoData);
        localStorage.setItem('customLogoName', selectedFile.name);
        
        // Call the callback if provided
        onLogoUpdate?.(logoData);
        
        toast({
          title: "Logo uploaded successfully!",
          description: "Your custom logo has been saved and will be used throughout the application.",
        });
        
        // Reset form
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(selectedFile);
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRestoreDefault = () => {
    localStorage.removeItem('customLogo');
    localStorage.removeItem('customLogoName');
    onLogoUpdate?.('default');
    toast({
      title: "Default logo restored",
      description: "The system will now use the default Point Art Solutions logo.",
    });
  };

  const currentCustomLogo = localStorage.getItem('customLogo');

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Logo Upload
        </CardTitle>
        <CardDescription>
          Upload your custom logo file. Supported formats: SVG, PNG, JPEG, WebP (max 5MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Logo Display */}
        {currentCustomLogo && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Current Custom Logo:</h4>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <img 
                src={currentCustomLogo} 
                alt="Current custom logo" 
                className="max-h-16 max-w-48 object-contain"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestoreDefault}
              >
                Restore Default
              </Button>
            </div>
          </div>
        )}

        {/* File Upload Area */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,.png,.jpg,.jpeg,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!previewUrl ? (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Upload your logo</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop or click to select a file
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Logo preview"
                    className="max-h-32 max-w-64 object-contain mx-auto"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                    onClick={handleRemove}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{selectedFile?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile && `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Upload Logo
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Logo Guidelines:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Recommended size: 400x200px or similar aspect ratio</li>
            <li>• Use SVG format for best quality at all sizes</li>
            <li>• Ensure good contrast for both light and dark themes</li>
            <li>• Keep file size under 5MB for optimal performance</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoUpload;
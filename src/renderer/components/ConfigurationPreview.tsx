import React, { useState, useEffect, useCallback, useRef } from "react";
import { LogiopsConfiguration } from "../types/logiops";
import { generateConfigFile } from "../utils/configParser";

interface ConfigurationPreviewProps {
  configuration: LogiopsConfiguration | null;
  onExport?: (content: string, format: "cfg") => void;
}

interface SyntaxToken {
  type:
    | "keyword"
    | "string"
    | "number"
    | "comment"
    | "property"
    | "value"
    | "bracket"
    | "text";
  value: string;
}

const ConfigurationPreview: React.FC<ConfigurationPreviewProps> = ({
  configuration,
  onExport,
}) => {
  const [previewContent, setPreviewContent] = useState<string>("");
  const [highlightedContent, setHighlightedContent] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "copying" | "success" | "error"
  >("idle");
  const [exportFormat, setExportFormat] = useState<"cfg">("cfg");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Generate preview content when configuration changes
  useEffect(() => {
    if (!configuration) {
      setPreviewContent("");
      setHighlightedContent(
        "// No configuration loaded\n// Create or load a configuration to see the preview"
      );
      return;
    }

    try {
      let content = generateConfigFile(configuration);

      setPreviewContent(content);

      // Generate syntax highlighted version
      const highlighted = highlightSyntax(content, exportFormat);
      setHighlightedContent(highlighted);
    } catch (error) {
      const errorMessage = `// Error generating preview: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      setPreviewContent(errorMessage);
      setHighlightedContent(errorMessage);
    }
  }, [configuration, exportFormat]);

  // Syntax highlighting for .cfg format
  const highlightSyntax = useCallback(
    (content: string, format: "cfg"): string => {
      return highlightCfg(content);
    },
    []
  );

  const highlightCfg = (content: string): string => {
    const lines = content.split("\n");
    const highlightedLines = lines.map((line) => {
      // Skip empty lines
      if (!line.trim()) {
        return line;
      }

      // Comments
      if (line.trim().startsWith("//")) {
        return `<span class="syntax-comment">${escapeHtml(line)}</span>`;
      }

      // Section headers (ending with {)
      if (line.includes("{")) {
        const parts = line.split("{");
        const sectionName = parts[0].trim().replace(/:$/, "");
        return `<span class="syntax-keyword">${escapeHtml(
          sectionName
        )}</span><span class="syntax-bracket">{</span>`;
      }

      // Closing brackets
      if (line.trim() === "};" || line.trim() === "}") {
        return `<span class="syntax-bracket">${escapeHtml(line)}</span>`;
      }

      // Properties (key: value;)
      if (line.includes(":")) {
        const colonIndex = line.indexOf(":");
        const key = line.substring(0, colonIndex);
        const valueAndSemicolon = line.substring(colonIndex + 1);

        const keyHighlighted = `<span class="syntax-property">${escapeHtml(
          key
        )}</span>`;
        const colonHighlighted = '<span class="syntax-text">:</span>';

        // Highlight the value part
        let valueHighlighted = valueAndSemicolon;

        // String values (quoted)
        if (valueAndSemicolon.includes('"')) {
          valueHighlighted = valueAndSemicolon.replace(
            /"([^"]*)"/g,
            '<span class="syntax-string">"$1"</span>'
          );
        }
        // Hex values
        else if (valueAndSemicolon.includes("0x")) {
          valueHighlighted = valueAndSemicolon.replace(
            /0x[0-9a-fA-F]+/g,
            '<span class="syntax-number">$&</span>'
          );
        }
        // Boolean values
        else if (
          valueAndSemicolon.includes("true") ||
          valueAndSemicolon.includes("false")
        ) {
          valueHighlighted = valueAndSemicolon.replace(
            /\b(true|false)\b/g,
            '<span class="syntax-keyword">$1</span>'
          );
        }
        // Numeric values
        else if (/\d+/.test(valueAndSemicolon)) {
          valueHighlighted = valueAndSemicolon.replace(
            /\b\d+\b/g,
            '<span class="syntax-number">$&</span>'
          );
        }
        // Arrays
        else if (
          valueAndSemicolon.includes("[") &&
          valueAndSemicolon.includes("]")
        ) {
          valueHighlighted = valueAndSemicolon
            .replace(/\[/g, '<span class="syntax-bracket">[</span>')
            .replace(/\]/g, '<span class="syntax-bracket">]</span>')
            .replace(/"([^"]*)"/g, '<span class="syntax-string">"$1"</span>');
        }

        // Highlight semicolon
        valueHighlighted = valueHighlighted.replace(
          /;/g,
          '<span class="syntax-text">;</span>'
        );

        return keyHighlighted + colonHighlighted + valueHighlighted;
      }

      return escapeHtml(line);
    });

    return highlightedLines.join("\n");
  };

  const escapeHtml = (text: string): string => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  // Copy to clipboard functionality
  const handleCopyToClipboard = useCallback(async () => {
    if (!previewContent) return;

    setCopyStatus("copying");

    try {
      await navigator.clipboard.writeText(previewContent);
      setCopyStatus("success");
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);

      // Fallback: select text in textarea
      if (textAreaRef.current) {
        textAreaRef.current.select();
        try {
          document.execCommand("copy");
          setCopyStatus("success");
          setTimeout(() => setCopyStatus("idle"), 2000);
        } catch (fallbackError) {
          setCopyStatus("error");
          setTimeout(() => setCopyStatus("idle"), 2000);
        }
      } else {
        setCopyStatus("error");
        setTimeout(() => setCopyStatus("idle"), 2000);
      }
    }
  }, [previewContent]);

  // Export functionality
  const handleExport = useCallback(() => {
    if (!previewContent || !onExport) return;
    onExport(previewContent, exportFormat);
  }, [previewContent, exportFormat, onExport]);

  // Format toggle
  const handleFormatChange = useCallback((format: "cfg") => {
    setExportFormat(format);
  }, []);

  const getCopyButtonText = () => {
    switch (copyStatus) {
      case "copying":
        return "Copying...";
      case "success":
        return "Copied!";
      case "error":
        return "Copy Failed";
      default:
        return "Copy to Clipboard";
    }
  };

  const getCopyButtonClass = () => {
    const baseClass = "preview-button";
    switch (copyStatus) {
      case "success":
        return `${baseClass} success`;
      case "error":
        return `${baseClass} error`;
      default:
        return baseClass;
    }
  };

  return (
    <div className="configuration-preview">
      <div className="preview-header">
        <h2>Configuration Preview</h2>
        <div className="preview-controls">
          <div className="preview-actions">
            <button
              className={getCopyButtonClass()}
              onClick={handleCopyToClipboard}
              disabled={!previewContent || copyStatus === "copying"}
              title="Copy configuration to clipboard"
            >
              📋 {getCopyButtonText()}
            </button>
            {onExport && (
              <button
                className="preview-button"
                onClick={handleExport}
                disabled={!previewContent}
                title="Export configuration to file"
              >
                💾 Export
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="preview-content">
        {/* Syntax highlighted display */}
        <div className="preview-display">
          <pre
            className="syntax-highlighted"
            dangerouslySetInnerHTML={{
              __html: highlightedContent || escapeHtml(previewContent),
            }}
          />
        </div>

        {/* Hidden textarea for fallback copy functionality */}
        <textarea
          ref={textAreaRef}
          value={previewContent}
          readOnly
          style={{ position: "absolute", left: "-9999px", opacity: 0 }}
          tabIndex={-1}
        />
      </div>

      <div className="preview-footer">
        <div className="preview-stats">
          {configuration && (
            <>
              <span>Devices: {configuration.devices.length}</span>
              <span>•</span>
              <span>Lines: {previewContent.split("\n").length}</span>
              <span>•</span>
              <span>Characters: {previewContent.length}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPreview;
